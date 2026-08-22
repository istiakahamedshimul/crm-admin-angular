import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import {
  ActivityHandling,
  EndSensitivity,
  GoogleGenAI,
  LiveConnectConfig,
  LiveServerMessage,
  Modality,
  Session,
  StartSensitivity,
  Type
} from '@google/genai';
import { ApiService } from './api.service';
import { Payment, UserSummary } from '../models/crm.models';
import { environment } from '../../environments/environment';

const GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const GEMINI_API_KEY = environment.geminiApiKey || '';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

interface SalesExecutiveContext {
  id: number;
  fullName: string;
  metrics?: {
    totalAssignedLeads: number;
    positiveCustomers: number;
    lost: number;
    notInterested: number;
    assignedStage: number;
  };
  unavailable?: boolean;
}

export interface CollectionVoiceFilter {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  period?: 'week' | 'month' | 'year' | 'overall' | 'custom';
  from?: string;
  to?: string;
  salesExecutiveName?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private router = inject(Router);
  private api = inject(ApiService);

  private listeningSubject = new BehaviorSubject(false);
  listening$: Observable<boolean> = this.listeningSubject.asObservable();

  private processingSubject = new BehaviorSubject(false);
  processing$: Observable<boolean> = this.processingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$: Observable<string | null> = this.errorSubject.asObservable();

  public autoSelectSalesExecutiveSubject = new BehaviorSubject<number | null>(null);
  autoSelectSalesExecutive$: Observable<number | null> =
    this.autoSelectSalesExecutiveSubject.asObservable();
  public followupExecutiveSubject = new BehaviorSubject<string | null>(null);
  followupExecutive$: Observable<string | null> = this.followupExecutiveSubject.asObservable();
  public leadExecutiveSubject = new BehaviorSubject<string | null>(null);
  leadExecutive$: Observable<string | null> = this.leadExecutiveSubject.asObservable();
  public collectionFilterSubject = new BehaviorSubject<CollectionVoiceFilter | null>(null);
  collectionFilter$: Observable<CollectionVoiceFilter | null> =
    this.collectionFilterSubject.asObservable();

  language: 'en' | 'bn' = 'en';

  private session: Session | null = null;
  private mediaStream: MediaStream | null = null;
  private captureContext: AudioContext | null = null;
  private captureSource: MediaStreamAudioSourceNode | null = null;
  private captureProcessor: ScriptProcessorNode | null = null;
  private captureSilencer: GainNode | null = null;

  private playbackContext: AudioContext | null = null;
  private playbackSources = new Set<AudioBufferSourceNode>();
  private nextPlaybackTime = 0;

  private explicitlyStarted = false;
  private setupComplete = false;
  private executives: SalesExecutiveContext[] = [];
  private voiceState: 'idle' | 'candidate' | 'speaking' | 'processing' = 'idle';
  private candidateChunks: Int16Array[] = [];
  private candidateVoiceFrames = 0;
  private lastVoiceAt = 0;
  private speechStartedAt = 0;
  private noiseFloor = 0.004;
  private serverTurnComplete = false;
  private processingTimeout: number | null = null;
  private audioChunksSent = 0;
  private audioBytesReceived = 0;
  private lastAudioDiagnosticAt = 0;
  private toolCallQueue: Promise<void> = Promise.resolve();
  private recentCommands = new Map<string, number>();
  private sessionGeneration = 0;
  private microphoneResumeAt = 0;

  constructor() {
    (window as any).crmVoiceDebug = {
      snapshot: () => this.getDebugSnapshot(),
      print: () => console.table(this.getDebugSnapshot())
    };
    this.debug('Voice service created. Run crmVoiceDebug.print() for current state.');
  }

  toggleLanguage(): void {
    this.language = this.language === 'en' ? 'bn' : 'en';

    // The language instruction is part of Live API session setup, so reconnect.
    if (this.explicitlyStarted) {
      void this.restartSession();
    }
  }

  async startListening(): Promise<void> {
    if (this.explicitlyStarted) {
      return;
    }

    this.explicitlyStarted = true;
    this.audioChunksSent = 0;
    this.audioBytesReceived = 0;
    this.debug('Start requested.', { language: this.language, model: GEMINI_MODEL });
    this.errorSubject.next(null);
    this.processingSubject.next(true);

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'GEMINI_API_KEY_PLACEHOLDER') {
      this.debugError('Gemini API key is missing or still uses the placeholder.');
      this.failSession('Gemini Live API key is not configured.');
      return;
    }

    try {
      this.executives = await this.loadSalesExecutiveContext();
      this.debug('CRM context loaded.', {
        executiveCount: this.executives.length,
        availableCount: this.executives.filter((item) => !item.unavailable).length
      });
      await this.openLiveSession();
    } catch (error) {
      console.error('Unable to start Gemini Live conversation:', error);
      this.failSession(
        this.language === 'bn'
          ? 'লাইভ ভয়েস কথোপকথন শুরু করা যায়নি।'
          : 'Could not start the live voice conversation.'
      );
    }
  }

  stopListening(): void {
    this.debug('Stop requested by user.');
    this.explicitlyStarted = false;
    this.listeningSubject.next(false);
    this.processingSubject.next(false);
    this.closeSession();
  }

  stopSpeaking(): void {
    this.stopPlayback();
  }

  private async restartSession(): Promise<void> {
    this.closeSession();
    this.errorSubject.next(null);
    this.processingSubject.next(true);

    try {
      this.executives = await this.loadSalesExecutiveContext();
      await this.openLiveSession();
    } catch (error) {
      console.error('Unable to restart Gemini Live conversation:', error);
      this.failSession(
        this.language === 'bn'
          ? 'ভাষা পরিবর্তনের পরে ভয়েস সেশন চালু করা যায়নি।'
          : 'Could not restart the voice session after changing language.'
      );
    }
  }

  private async loadSalesExecutiveContext(): Promise<SalesExecutiveContext[]> {
    const users = await firstValueFrom(this.api.users());
    const salesUsers = users.filter((user: UserSummary) => user.role === 'SalesExecutive');

    return Promise.all(
      salesUsers.map(async (user) => {
        try {
          const detail = await firstValueFrom(this.api.salesExecutiveDetail(user.id));
          return {
            id: user.id,
            fullName: user.fullName,
            metrics: {
              totalAssignedLeads: detail.metrics.totalAssignedLeads,
              positiveCustomers: detail.metrics.positiveCustomers,
              lost: detail.metrics.lost,
              notInterested: detail.metrics.notInterested,
              assignedStage: detail.metrics.assignedStage
            }
          };
        } catch {
          return { id: user.id, fullName: user.fullName, unavailable: true };
        }
      })
    );
  }

  private async openLiveSession(): Promise<void> {
    this.setupComplete = false;
    this.debug('Opening Gemini Live SDK session...');
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const session = await ai.live.connect({
      model: GEMINI_MODEL,
      config: this.createSessionConfig(),
      callbacks: {
        onopen: () => this.debug('Gemini Live WebSocket opened.'),
        onmessage: (message: LiveServerMessage) => this.handleServerMessage(message),
        onerror: (error) => {
          this.debugError('Gemini Live connection error.', error);
          this.errorSubject.next(
            this.language === 'bn'
              ? 'Gemini Live সংযোগে সমস্যা হয়েছে।'
              : 'The Gemini Live connection failed.'
          );
        },
        onclose: (event) => {
          this.debugError('Gemini Live connection closed.', event);
          this.setupComplete = false;
          this.listeningSubject.next(false);
          if (this.explicitlyStarted) {
            this.errorSubject.next(
              this.language === 'bn'
                ? 'লাইভ ভয়েস সংযোগ বিচ্ছিন্ন হয়েছে। আবার চেষ্টা করুন।'
                : 'The live voice connection ended. Please try again.'
            );
            this.explicitlyStarted = false;
          }
        }
      }
    });

    if (!this.explicitlyStarted) {
      session.close();
      throw new Error('Voice session was stopped before connecting.');
    }

    this.session = session;
    this.setupComplete = true;
    this.debug('Gemini Live session ready; requesting microphone.');
    this.processingSubject.next(false);
    await this.startMicrophone();
    this.listeningSubject.next(true);
  }

  private createSessionConfig(): LiveConnectConfig {
    const answerLanguage =
      this.language === 'bn'
        ? 'Always understand and speak natural Bengali. Use English names only when needed.'
        : 'Always understand and speak natural English. Understand Bengali names and accents too.';

    return {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `You are the live voice assistant for a real-estate CRM administrator.
${answerLanguage}

Have a direct, natural spoken conversation. Keep answers clear and concise. Never use text-to-speech,
never say that you are reading JSON, and never invent CRM data.

Your main job is to explain a sales executive's performance when the administrator asks. Match spoken
names flexibly, including Bengali pronunciation and transliteration. Use only the current CRM data below.
Explain assigned leads, booked/positive customers, lost leads, not-interested leads, and assigned-stage
leads in a natural summary. If a metric or person is unavailable, say so honestly.

When a sales executive is matched, call open_sales_executive_performance with the exact CRM id so the
admin panel opens that person's profile. This tool is mandatory for every request to open, show, inspect,
or explain a salesperson profile or performance. Continue with a spoken explanation after the tool result.

If the admin asks for a salesperson's follow-ups, call open_sales_executive_followups with the exact id.
If the admin asks for a salesperson's leads, call open_sales_executive_leads with the exact id.

For collection/payment requests, call filter_collections. Apply every criterion the admin states:
status, period, custom dates, salesperson, customer, collection number, or search text. Always tell the
admin which collection page and filters were opened. Collections and payments refer to the same CRM page.

You may also open a known CRM page with open_crm_page when explicitly asked.
For any request outside these supported CRM capabilities, always respond politely:
- English: "I'm sorry, I can't do this."
- Bengali: "দুঃখিত, আমি এটি করতে পারি না।"
Do not silently ignore any request; always give a spoken response.
Treat one user utterance as exactly one question. If duplicate tool calls represent the same request,
use the first tool result and give only one spoken answer. Never repeat an answer in the same turn.

Current sales executive performance data:
${JSON.stringify(this.executives)}`,
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      tools: [{
          functionDeclarations: [
            {
              name: 'open_sales_executive_performance',
              description: 'Open the matched sales executive profile in the CRM.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  executiveId: { type: Type.INTEGER }
                },
                required: ['executiveId']
              }
            },
            {
              name: 'open_crm_page',
              description: 'Open a supported CRM page.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  route: {
                    type: Type.STRING,
                    enum: [
                      '/', '/users', '/leads', '/followups', '/customers',
                      '/properties/projects', '/payments', '/commissions', '/reports',
                      '/transport/requests', '/transport/schedule', '/transport/vehicles'
                    ]
                  }
                },
                required: ['route']
              }
            },
            {
              name: 'open_sales_executive_followups',
              description: 'Open the Follow-ups page filtered to the exact matched sales executive.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  executiveId: { type: Type.INTEGER }
                },
                required: ['executiveId']
              }
            },
            {
              name: 'open_sales_executive_leads',
              description: 'Open the Leads page filtered to the exact matched sales executive.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  executiveId: { type: Type.INTEGER }
                },
                required: ['executiveId']
              }
            },
            {
              name: 'filter_collections',
              description: 'Open Collections and apply the requested status, period, salesperson, date, or search filters.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  status: {
                    type: Type.STRING,
                    enum: ['all', 'pending', 'approved', 'rejected']
                  },
                  period: {
                    type: Type.STRING,
                    enum: ['week', 'month', 'year', 'overall', 'custom']
                  },
                  from: { type: Type.STRING, description: 'Custom start date in YYYY-MM-DD format.' },
                  to: { type: Type.STRING, description: 'Custom end date in YYYY-MM-DD format.' },
                  salesExecutiveName: { type: Type.STRING },
                  search: {
                    type: Type.STRING,
                    description: 'Customer, collection number, amount, or other search text.'
                  }
                }
              }
            }
          ]
        }],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
          endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
          silenceDurationMs: 700
        },
        activityHandling: ActivityHandling.NO_INTERRUPTION
      }
    };
  }

  private async startMicrophone(): Promise<void> {
    // Keep this identical to the proven ShopSenseAI capture path. Browser/
    // device-specific processing constraints were producing zeroed PCM on the
    // affected machine.
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.captureContext = new AudioContext();
    await this.captureContext.resume();
    this.debug('Microphone permission granted.', {
      browserSampleRate: this.captureContext.sampleRate,
      targetSampleRate: INPUT_SAMPLE_RATE,
      track: this.mediaStream.getAudioTracks()[0]?.getSettings()
    });
    this.captureSource = this.captureContext.createMediaStreamSource(this.mediaStream);
    this.captureProcessor = this.captureContext.createScriptProcessor(4096, 1, 1);

    this.captureProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
      if (
        !this.setupComplete ||
        !this.session ||
        this.voiceState === 'processing' ||
        performance.now() < this.microphoneResumeAt
      ) {
        return;
      }

      const source = event.inputBuffer.getChannelData(0);
      const resampled = this.resample(source, event.inputBuffer.sampleRate, INPUT_SAMPLE_RATE);
      const pcm = this.floatToPcm16(resampled);
      const now = performance.now();
      if (now - this.lastAudioDiagnosticAt >= 1000) {
        this.lastAudioDiagnosticAt = now;
        this.debug('Microphone streaming.', {
          level: Number(this.calculateRms(source).toFixed(4)),
          state: this.voiceState,
          chunksSent: this.audioChunksSent
        });
      }
      // Match the working ShopSenseAI flow: stream each PCM frame through the
      // official SDK and let Gemini's speech detector decide when the turn ends.
      this.sendAudioChunk(pcm);
    };

    this.captureSource.connect(this.captureProcessor);
    // ScriptProcessor emits an empty output buffer, so this keeps the processor
    // alive without playing the microphone back through the speakers.
    this.captureProcessor.connect(this.captureContext.destination);
  }

  private handleServerMessage(message: LiveServerMessage): void {
    const inputTranscript = message.serverContent?.inputTranscription?.text;
    const outputTranscript = message.serverContent?.outputTranscription?.text;
    this.debug('Gemini message received.', {
      inputTranscript: inputTranscript || undefined,
      outputTranscript: outputTranscript || undefined,
      audioParts: message.serverContent?.modelTurn?.parts?.filter(
        (part) => Boolean(part.inlineData?.data)
      ).length || 0,
      toolCalls: message.toolCall?.functionCalls?.map((call) => call.name) || [],
      interrupted: Boolean(message.serverContent?.interrupted),
      turnComplete: Boolean(message.serverContent?.turnComplete)
    });

    if (message.serverContent?.interrupted) {
      this.stopPlayback();
    }

    const parts = message.serverContent?.modelTurn?.parts || [];
    if (parts.length > 0 || message.toolCall?.functionCalls?.length) {
      this.beginProcessingResponse();
    }
    for (const part of parts) {
      if (part.inlineData?.data) {
        this.queueNativeAudio(part.inlineData.data);
      }
    }

    if (message.toolCall?.functionCalls) {
      this.serverTurnComplete = false;
      this.handleToolCalls(message.toolCall.functionCalls);
    }

    if (message.serverContent?.turnComplete) {
      this.serverTurnComplete = true;
      this.finishProcessingWhenPlaybackEnds();
    }
  }

  private handleToolCalls(functionCalls: any[]): void {
    // Live API messages may overlap. Serialize them so two matching commands
    // cannot both pass the duplicate check before either one starts executing.
    const generation = this.sessionGeneration;
    this.toolCallQueue = this.toolCallQueue
      .then(() => this.processToolCalls(functionCalls, generation))
      .catch((error) => this.debugError('Tool call processing failed.', error));
  }

  private async processToolCalls(functionCalls: any[], generation: number): Promise<void> {
    if (generation !== this.sessionGeneration || !this.session) return;

    const responses = [];
    for (const call of functionCalls) {
      this.debug('Executing Gemini tool call.', { name: call.name, args: call.args });
      let result = 'Unsupported action.';
      const commandKey = this.commandKey(call.name, call.args);
      const now = Date.now();
      const lastExecutedAt = this.recentCommands.get(commandKey) || 0;
      const isDuplicate = now - lastExecutedAt < 2500;

      this.removeExpiredCommands(now);

      if (isDuplicate) {
        result = 'Duplicate command ignored. The action was already completed. Do not repeat the spoken answer.';
        this.debug('Duplicate Gemini tool call ignored.', {
          name: call.name,
          args: call.args,
          elapsedMs: now - lastExecutedAt
        });
      } else {
        // Reserve the command before awaiting navigation or an API call. This
        // guarantees at-most-once execution even when duplicate calls overlap.
        this.recentCommands.set(commandKey, now);

        if (call.name === 'open_sales_executive_performance') {
        const executiveId = Number(call.args?.executiveId);
        const executive = this.executives.find((item) => item.id === executiveId);
        if (executive) {
          await this.router.navigate(['/users', executiveId]);
          result = `Opened ${executive.fullName}'s performance profile.`;
          this.debug('Navigating to sales executive profile.', {
            executiveId,
            executiveName: executive.fullName,
            route: `/users/${executiveId}`
          });
        } else {
          result = 'No matching sales executive was found.';
        }
      } else if (call.name === 'open_crm_page') {
        const route = String(call.args?.route || '');
        const allowedRoutes = [
          '/', '/users', '/leads', '/followups', '/customers', '/properties/projects',
          '/payments', '/commissions', '/reports', '/transport/requests',
          '/transport/schedule', '/transport/vehicles'
        ];
        if (allowedRoutes.includes(route)) {
          await this.router.navigateByUrl(route);
          result = `Opened ${route}.`;
          this.debug('Navigating to CRM page.', { route });
        }
      } else if (call.name === 'open_sales_executive_followups') {
        const executive = this.findExecutive(Number(call.args?.executiveId));
        if (executive) {
          await this.router.navigateByUrl('/followups');
          this.followupExecutiveSubject.next(executive.fullName);
          result = `Opened follow-ups for ${executive.fullName}.`;
        } else {
          result = 'No matching sales executive was found.';
        }
      } else if (call.name === 'open_sales_executive_leads') {
        const executive = this.findExecutive(Number(call.args?.executiveId));
        if (executive) {
          await this.router.navigateByUrl('/leads');
          this.leadExecutiveSubject.next(executive.fullName);
          result = `Opened leads for ${executive.fullName}.`;
        } else {
          result = 'No matching sales executive was found.';
        }
      } else if (call.name === 'filter_collections') {
        const requestedName = String(call.args?.salesExecutiveName || '').trim();
        const matchedExecutive = requestedName
          ? this.executives.find((item) =>
              item.fullName.toLowerCase().includes(requestedName.toLowerCase()) ||
              requestedName.toLowerCase().includes(item.fullName.toLowerCase())
            )
          : undefined;
        const filter: CollectionVoiceFilter = {
          status: call.args?.status || 'all',
          period: call.args?.period || 'overall',
          from: call.args?.from,
          to: call.args?.to,
          salesExecutiveName: matchedExecutive?.fullName || requestedName || undefined,
          search: call.args?.search
        };
        if (filter.from || filter.to) {
          filter.period = 'custom';
        }
        await this.router.navigateByUrl('/payments');
        this.collectionFilterSubject.next(filter);
        const criteria = [
          filter.status !== 'all' ? filter.status : '',
          filter.period,
          filter.salesExecutiveName,
          filter.search
        ].filter(Boolean).join(', ');
        try {
          const payments = await firstValueFrom(this.api.payments());
          const matching = this.filterCollections(payments, filter);
          const amount = matching.reduce(
            (sum, payment) => sum + Math.abs(payment.amount || 0),
            0
          );
          result =
            `Opened collections filtered by ${criteria || 'all records'}. ` +
            `There are ${matching.length} matching collections with a total amount of ${amount}.`;
        } catch {
          result = `Opened collections filtered by ${criteria || 'all records'}.`;
        }
        }
      }

      responses.push({
        id: call.id,
        name: call.name,
        response: { result }
      });
    }

    if (generation !== this.sessionGeneration || !this.session) return;
    this.session.sendToolResponse({ functionResponses: responses });
    this.debug('Tool response sent to Gemini.', {
      responses: responses.map((item) => ({
        id: item.id,
        name: item.name,
        result: item.response.result
      }))
    });
  }

  private commandKey(name: unknown, args: unknown): string {
    const commandName = String(name || '');
    const values = (args && typeof args === 'object')
      ? args as Record<string, unknown>
      : {};
    let normalizedArgs: Record<string, unknown> = values;

    if (
      commandName === 'open_sales_executive_performance' ||
      commandName === 'open_sales_executive_followups' ||
      commandName === 'open_sales_executive_leads'
    ) {
      normalizedArgs = { executiveId: Number(values['executiveId']) };
    } else if (commandName === 'open_crm_page') {
      normalizedArgs = { route: String(values['route'] || '').trim().toLowerCase() };
    } else if (commandName === 'filter_collections') {
      normalizedArgs = {
        status: String(values['status'] || 'all').toLowerCase(),
        period: String(values['period'] || 'overall').toLowerCase(),
        from: String(values['from'] || ''),
        to: String(values['to'] || ''),
        salesExecutiveName: String(values['salesExecutiveName'] || '').trim().toLowerCase(),
        search: String(values['search'] || '').trim().toLowerCase()
      };
    }

    return `${commandName}:${this.stableJson(normalizedArgs)}`;
  }

  private stableJson(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableJson(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => `${JSON.stringify(key)}:${this.stableJson(item)}`)
        .join(',')}}`;
    }
    return JSON.stringify(value) ?? String(value);
  }

  private removeExpiredCommands(now: number): void {
    for (const [key, executedAt] of this.recentCommands) {
      if (now - executedAt >= 10000) {
        this.recentCommands.delete(key);
      }
    }
  }

  private findExecutive(id: number): SalesExecutiveContext | undefined {
    return this.executives.find((item) => item.id === id);
  }

  private filterCollections(
    payments: Payment[],
    filter: CollectionVoiceFilter
  ): Payment[] {
    const statusValue = filter.status === 'pending'
      ? 0
      : filter.status === 'approved'
        ? 1
        : filter.status === 'rejected'
          ? 2
          : null;
    const now = new Date();

    return payments.filter((payment) => {
      if (statusValue === 1 && (payment.status !== 1 || payment.isReversed)) return false;
      if (statusValue === 0 && (payment.status !== 0 || payment.isReversed)) return false;
      if (statusValue === 2 && payment.status !== 2 && !payment.isReversed) return false;

      const paid = new Date(`${payment.paymentDate.slice(0, 10)}T12:00:00`);
      if (filter.period === 'week') {
        const day = now.getDay();
        const daysSinceMonday = day === 0 ? 6 : day - 1;
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
        if (paid < start) return false;
      } else if (filter.period === 'month') {
        if (
          paid.getFullYear() !== now.getFullYear() ||
          paid.getMonth() !== now.getMonth()
        ) return false;
      } else if (filter.period === 'year' && paid.getFullYear() !== now.getFullYear()) {
        return false;
      } else if (filter.period === 'custom') {
        if (filter.from && paid < new Date(`${filter.from}T00:00:00`)) return false;
        if (filter.to && paid > new Date(`${filter.to}T23:59:59.999`)) return false;
      }

      if (
        filter.salesExecutiveName &&
        !payment.salesExecutive.toLowerCase().includes(
          filter.salesExecutiveName.toLowerCase()
        )
      ) return false;

      if (filter.search) {
        const query = filter.search.toLowerCase();
        if (
          !payment.customer.toLowerCase().includes(query) &&
          !payment.collectionNumber.toLowerCase().includes(query) &&
          !payment.salesExecutive.toLowerCase().includes(query) &&
          !String(payment.amount).includes(query)
        ) return false;
      }
      return true;
    });
  }

  private queueNativeAudio(base64Data: string): void {
    const bytes = this.base64ToBytes(base64Data);
    this.audioBytesReceived += bytes.byteLength;
    const sampleCount = Math.floor(bytes.byteLength / 2);
    if (!sampleCount) {
      return;
    }

    if (!this.playbackContext) {
      this.playbackContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      this.nextPlaybackTime = this.playbackContext.currentTime;
    }

    const samples = new Float32Array(sampleCount);
    const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
    for (let index = 0; index < sampleCount; index++) {
      samples[index] = view.getInt16(index * 2, true) / 32768;
    }

    const buffer = this.playbackContext.createBuffer(1, sampleCount, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(samples, 0);
    const source = this.playbackContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.playbackContext.destination);

    const startAt = Math.max(this.playbackContext.currentTime, this.nextPlaybackTime);
    this.nextPlaybackTime = startAt + buffer.duration;
    this.playbackSources.add(source);
    source.onended = () => {
      this.playbackSources.delete(source);
      this.finishProcessingWhenPlaybackEnds();
    };
    source.start(startAt);
    this.debug('Native audio queued.', {
      chunkBytes: bytes.byteLength,
      totalAudioBytes: this.audioBytesReceived,
      durationMs: Math.round(buffer.duration * 1000),
      queuedSources: this.playbackSources.size
    });
  }

  private stopPlayback(): void {
    for (const source of this.playbackSources) {
      try {
        source.stop();
      } catch {
        // The source may already have ended.
      }
    }
    this.playbackSources.clear();
    this.nextPlaybackTime = this.playbackContext?.currentTime || 0;
  }

  private closeSession(): void {
    this.sessionGeneration++;
    this.recentCommands.clear();
    this.microphoneResumeAt = 0;
    this.setupComplete = false;
    this.resetVoiceDetection();
    if (this.processingTimeout !== null) {
      window.clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    this.stopPlayback();

    if (this.captureProcessor) {
      this.captureProcessor.onaudioprocess = null;
      this.captureProcessor.disconnect();
      this.captureProcessor = null;
    }
    this.captureSource?.disconnect();
    this.captureSource = null;
    this.captureSilencer?.disconnect();
    this.captureSilencer = null;
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    void this.captureContext?.close();
    this.captureContext = null;
    void this.playbackContext?.close();
    this.playbackContext = null;

    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }

  private failSession(message: string): void {
    this.explicitlyStarted = false;
    this.listeningSubject.next(false);
    this.processingSubject.next(false);
    this.errorSubject.next(message);
    this.closeSession();
  }

  private processMicrophoneFrame(samples: Float32Array, pcm: Int16Array): void {
    const now = performance.now();
    const rms = this.calculateRms(samples);
    const peak = this.calculatePeak(samples);

    // The adaptive floor follows quiet background sound slowly. A clear voice must
    // be substantially louder than that floor and also exceed an absolute level.
    if (this.voiceState === 'idle' && rms < Math.max(0.012, this.noiseFloor * 2.2)) {
      this.noiseFloor = this.noiseFloor * 0.97 + rms * 0.03;
    }
    const speechThreshold = Math.max(0.014, Math.min(0.06, this.noiseFloor * 3.5));
    const clearVoice = rms >= speechThreshold && peak >= speechThreshold * 1.8;

    if (this.voiceState === 'idle') {
      if (!clearVoice) {
        return;
      }
      this.voiceState = 'candidate';
      this.candidateChunks = [pcm];
      this.candidateVoiceFrames = 1;
      this.lastVoiceAt = now;
      return;
    }

    if (this.voiceState === 'candidate') {
      this.candidateChunks.push(pcm);
      if (this.candidateChunks.length > 5) {
        this.candidateChunks.shift();
      }

      if (clearVoice) {
        this.candidateVoiceFrames++;
        this.lastVoiceAt = now;
      } else if (now - this.lastVoiceAt > 260) {
        // A short click, fan burst, or other noise never reaches Gemini.
        this.resetVoiceDetection();
        return;
      }

      if (this.candidateVoiceFrames >= 3) {
        this.voiceState = 'speaking';
        this.speechStartedAt = now;
        for (const chunk of this.candidateChunks) {
          this.sendAudioChunk(chunk);
        }
        this.candidateChunks = [];
        this.listeningSubject.next(true);
      }
      return;
    }

    if (this.voiceState === 'speaking') {
      this.sendAudioChunk(pcm);
      if (clearVoice) {
        this.lastVoiceAt = now;
      }

      if (now - this.lastVoiceAt >= 900 && now - this.speechStartedAt >= 350) {
        // Explicitly close this audio turn so Gemini responds immediately. The
        // next clear speech chunk automatically opens a fresh input stream.
        this.sendRealtimeInput({ audioStreamEnd: true });
        this.voiceState = 'processing';
        this.serverTurnComplete = false;
        this.listeningSubject.next(false);
        this.processingSubject.next(true);
        this.startProcessingTimeout();
      }
    }
  }

  private sendAudioChunk(pcm: Int16Array): void {
    this.audioChunksSent++;
    this.sendRealtimeInput({
      media: {
        data: this.bytesToBase64(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength)),
        mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`
      }
    });
  }

  private sendRealtimeInput(input: object): void {
    this.session?.sendRealtimeInput(input);
  }

  private beginProcessingResponse(): void {
    if (this.voiceState === 'processing') {
      return;
    }

    this.voiceState = 'processing';
    this.debug('Gemini started responding; microphone transmission paused.');
    this.serverTurnComplete = false;
    this.listeningSubject.next(false);
    this.processingSubject.next(true);
    this.startProcessingTimeout();
  }

  private finishProcessingWhenPlaybackEnds(): void {
    if (
      this.voiceState !== 'processing' ||
      !this.serverTurnComplete ||
      this.playbackSources.size > 0
    ) {
      return;
    }

    if (this.processingTimeout !== null) {
      window.clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    this.processingSubject.next(false);
    this.debug('Gemini turn and audio playback completed; listening resumed.');
    // Avoid treating the tail of speaker playback as another user question on
    // devices with weak acoustic echo cancellation.
    this.microphoneResumeAt = performance.now() + 600;
    this.resetVoiceDetection();
    if (this.explicitlyStarted && this.setupComplete) {
      this.listeningSubject.next(true);
    }
  }

  private startProcessingTimeout(): void {
    if (this.processingTimeout !== null) {
      window.clearTimeout(this.processingTimeout);
    }
    this.processingTimeout = window.setTimeout(() => {
      if (this.voiceState !== 'processing') {
        return;
      }
      this.processingSubject.next(false);
      this.debugError('Gemini response timed out after 30 seconds.', this.getDebugSnapshot());
      this.errorSubject.next(
        this.language === 'bn'
          ? 'কমান্ডটি প্রক্রিয়া করা যায়নি। পরিষ্কারভাবে আবার বলুন।'
          : 'The command could not be processed. Please speak clearly and try again.'
      );
      this.resetVoiceDetection();
      if (this.explicitlyStarted && this.setupComplete) {
        this.listeningSubject.next(true);
      }
    }, 30000);
  }

  private resetVoiceDetection(): void {
    this.voiceState = 'idle';
    this.candidateChunks = [];
    this.candidateVoiceFrames = 0;
    this.lastVoiceAt = 0;
    this.speechStartedAt = 0;
    this.serverTurnComplete = false;
  }

  private calculateRms(samples: Float32Array): number {
    let sum = 0;
    for (let index = 0; index < samples.length; index++) {
      sum += samples[index] * samples[index];
    }
    return Math.sqrt(sum / Math.max(1, samples.length));
  }

  private calculatePeak(samples: Float32Array): number {
    let peak = 0;
    for (let index = 0; index < samples.length; index++) {
      peak = Math.max(peak, Math.abs(samples[index]));
    }
    return peak;
  }

  private resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) {
      return input;
    }

    const ratio = fromRate / toRate;
    const length = Math.max(1, Math.ceil(input.length / ratio));
    const output = new Float32Array(length);
    for (let index = 0; index < length; index++) {
      const start = Math.floor(index * ratio);
      const end = Math.min(input.length, Math.ceil((index + 1) * ratio));
      let sum = 0;
      let count = 0;
      for (let sourceIndex = start; sourceIndex < end; sourceIndex++) {
        sum += input[sourceIndex];
        count++;
      }
      output[index] = count > 0 ? sum / count : 0;
    }
    return output;
  }

  private floatToPcm16(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let index = 0; index < input.length; index++) {
      const sample = Math.max(-1, Math.min(1, input[index]));
      output[index] = sample < 0 ? sample * 32768 : sample * 32767;
    }
    return output;
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return window.btoa(binary);
  }

  private base64ToBytes(value: string): Uint8Array {
    const binary = window.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  private getDebugSnapshot(): Record<string, unknown> {
    return {
      model: GEMINI_MODEL,
      language: this.language,
      explicitlyStarted: this.explicitlyStarted,
      sessionConnected: Boolean(this.session),
      setupComplete: this.setupComplete,
      microphoneActive: Boolean(this.mediaStream?.active),
      audioContextState: this.captureContext?.state || 'none',
      voiceState: this.voiceState,
      audioChunksSent: this.audioChunksSent,
      audioBytesReceived: this.audioBytesReceived,
      executivesLoaded: this.executives.length,
      playbackSources: this.playbackSources.size,
      serverTurnComplete: this.serverTurnComplete
    };
  }

  private debug(message: string, details?: unknown): void {
    if (details === undefined) {
      console.info(`[CRM Voice] ${message}`);
    } else {
      console.info(`[CRM Voice] ${message}`, details);
    }
  }

  private debugError(message: string, details?: unknown): void {
    if (details === undefined) {
      console.error(`[CRM Voice] ${message}`);
    } else {
      console.error(`[CRM Voice] ${message}`, details);
    }
  }
}
