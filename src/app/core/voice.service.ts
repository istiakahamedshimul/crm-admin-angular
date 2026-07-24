import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserSummary } from '../models/crm.models';
import { environment } from '../../environments/environment';

// You can change the model name here. 
// gemini-2.0-flash and gemini-3.6-flash both natively support the ["AUDIO", "TEXT"] response modalities.
const GEMINI_MODEL = 'gemini-2.0-flash'; 
const GEMINI_API_KEY = environment.geminiApiKey || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private router = inject(Router);
  private api = inject(ApiService);
  private http = inject(HttpClient);

  // Observables for state management
  private listeningSubject = new BehaviorSubject<boolean>(false);
  listening$: Observable<boolean> = this.listeningSubject.asObservable();

  private processingSubject = new BehaviorSubject<boolean>(false);
  processing$: Observable<boolean> = this.processingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$: Observable<string | null> = this.errorSubject.asObservable();

  // Subject to trigger auto-selection in UsersComponent
  public autoSelectSalesExecutiveSubject = new BehaviorSubject<number | null>(null);
  autoSelectSalesExecutive$: Observable<number | null> = this.autoSelectSalesExecutiveSubject.asObservable();

  // Active language code: 'en' for English, 'bn' for Bengali
  language: 'en' | 'bn' = 'en';

  private recognition: any;
  private isExplicitlyStarted = false; // Flag to maintain continuous listening state
  private activeAudioSource: AudioBufferSourceNode | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initSpeechRecognition();
  }

  toggleLanguage() {
    this.language = this.language === 'en' ? 'bn' : 'en';
    if (this.recognition) {
      this.recognition.lang = this.language === 'bn' ? 'bn-BD' : 'en-US';
      if (this.isExplicitlyStarted) {
        this.stopListening();
        setTimeout(() => this.startListening(), 300);
      }
    }
  }

  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.errorSubject.next('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true; 
    this.recognition.interimResults = false;
    this.recognition.lang = this.language === 'bn' ? 'bn-BD' : 'en-US';

    this.recognition.onstart = () => {
      this.listeningSubject.next(true);
      this.errorSubject.next(null);
    };

    this.recognition.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const speechText = event.results[resultIndex][0].transcript.trim();
      
      if (speechText) {
        this.processingSubject.next(true);
        this.processLiveConversation(speechText);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.errorSubject.next('Microphone permission denied. Please allow mic access.');
        this.isExplicitlyStarted = false;
        this.listeningSubject.next(false);
      } else if (event.error === 'aborted') {
        // Normal stop state
      } else {
        this.errorSubject.next(`Speech capture: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      if (this.isExplicitlyStarted) {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('Failed to restart speech recognition:', e);
        }
      } else {
        this.listeningSubject.next(false);
      }
    };
  }

  startListening() {
    this.isExplicitlyStarted = true;
    this.stopSpeaking();
    
    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Speech recognition already running:', e);
      }
    }
  }

  stopListening() {
    this.isExplicitlyStarted = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Failed to stop speech recognition:', e);
      }
    }
    this.listeningSubject.next(false);
  }

  private loadDatabaseContext(callback: (context: string) => void) {
    this.api.users().subscribe({
      next: (users: UserSummary[]) => {
        const salesUsers = users.filter(u => u.role === 'SalesExecutive');
        if (salesUsers.length === 0) {
          callback('[]');
          return;
        }

        const promises = salesUsers.map(user => {
          return new Promise<any>((resolve) => {
            this.api.salesExecutiveDetail(user.id).subscribe({
              next: (detail) => {
                resolve({
                  id: user.id,
                  fullName: user.fullName,
                  totalAssignedLeads: detail.metrics.totalAssignedLeads,
                  bookedCustomers: detail.metrics.positiveCustomers,
                  lostLeads: detail.metrics.lost,
                  notInterested: detail.metrics.notInterested,
                  assignedStage: detail.metrics.assignedStage
                });
              },
              error: () => resolve({ id: user.id, fullName: user.fullName, error: true })
            });
          });
        });

        Promise.all(promises).then((data) => {
          callback(JSON.stringify(data));
        });
      },
      error: () => callback('[]')
    });
  }

  private processLiveConversation(speechText: string) {
    // Step 1: Load complete database context dynamically from backend
    this.loadDatabaseContext((dbContext) => {
      const systemPrompt = `You are a voice command assistant for a Real Estate CRM Admin Panel.
You process queries from the administrator and respond with BOTH a JSON object in the text block AND a natural, human-sounding voice in the audio block.

Available Pages / Routes:
- Dashboard: "/dashboard"
- Leads: "/leads"
- Follow-ups: "/followups"
- Customers: "/customers"
- Projects: "/properties/projects"
- Invoices: "/invoices"
- Transport Schedule / Vehicle Bookings: "/transport/schedule"
- Payments/Collections: "/payments"
- Commissions: "/commissions"
- Reports: "/reports"

Database Context (Current Sales Executives Metrics):
${dbContext}

User Spoken Command: "${speechText}"

Instructions:
1. Parse the user's spoken command (can be in English or Bengali).
2. If navigating: set "action" to "navigate", "target" to the route path, and "spokenResponse" to a polite confirmation (e.g. "Opening leads page").
3. If requesting performance:
   - Match the executive name to the database name (e.g. "ইশতিয়াক" to "Istiak").
   - Extract the statistics from the Database Context.
   - Build a detailed summary text in the user's spoken language. Set "action" to "view_performance", "target" to the matching name, "targetId" to their user ID, and "spokenResponse" to the detailed summary text.
4. If the command is not supported, set "action" to "unknown", "target" to "", and "spokenResponse" to:
   - English: "I'm sorry, I cannot do this."
   - Bengali: "আমি দুঃখিত, আমি এটি করতে পারছি না।"

Format numbers as words in your spokenResponse (e.g. read '11' as 'eleven' or 'এগারো' instead of 'one one' or 'এক এক') to make it sound 100% natural.

Return ONLY a valid JSON object matching this type:
{
  "action": "navigate" | "view_performance" | "unknown",
  "target": string,
  "targetId": number | null,
  "spokenResponse": string
}`;

      const requestBody = {
        contents: [{
          parts: [{ text: systemPrompt }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO", "TEXT"],
          responseMimeType: "application/json"
        }
      };

      // Temporarily pause mic listening while querying the API
      if (this.isExplicitlyStarted && this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }

      this.http.post<any>(GEMINI_URL, requestBody).subscribe({
        next: (response) => {
          this.processingSubject.next(false);
          try {
            const parts = response.candidates[0].content.parts;
            let jsonText = '';
            let audioBase64 = '';

            for (const part of parts) {
              if (part.text) {
                jsonText = part.text;
              } else if (part.inlineData && part.inlineData.data) {
                audioBase64 = part.inlineData.data;
              }
            }

            if (jsonText) {
              const intent = JSON.parse(jsonText.trim());
              this.executeParsedAction(intent, audioBase64);
            } else {
              console.warn('No text JSON found in Gemini output.');
              this.resumeListening();
            }
          } catch (e) {
            console.error('Failed to parse Gemini multimodal response:', e);
            this.errorSubject.next('Failed to process conversation.');
            this.resumeListening();
          }
        },
        error: (err) => {
          console.error('Gemini Multimodal API Error:', err);
          this.processingSubject.next(false);
          this.errorSubject.next('Failed to connect to live voice LLM.');
          this.resumeListening();
        }
      });
    });
  }

  private executeParsedAction(intent: { action: string; target: string; targetId: number | null; spokenResponse: string }, audioBase64: string) {
    if (intent.action === 'navigate') {
      this.playAndExecute(audioBase64, intent.spokenResponse, () => {
        this.router.navigateByUrl(intent.target);
      });
    } else if (intent.action === 'view_performance' && intent.targetId) {
      this.playAndExecute(audioBase64, intent.spokenResponse, () => {
        this.autoSelectSalesExecutiveSubject.next(intent.targetId);
        this.router.navigateByUrl('/users');
      });
    } else {
      this.playAndExecute(audioBase64, intent.spokenResponse, () => {});
    }
  }

  private playAndExecute(audioBase64: string, textFallback: string, actionCallback: () => void) {
    // If Gemini returned a native audio response, play it
    if (audioBase64) {
      this.playPCMAudio(audioBase64, actionCallback);
    } else {
      // Otherwise, run action immediately and speak using local fallback
      actionCallback();
      this.fallbackBrowserSpeak(textFallback);
    }
  }

  private playPCMAudio(base64Data: string, onEndedCallback: () => void) {
    try {
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const arrayBuffer = bytes.buffer;
      const view = new DataView(arrayBuffer);
      const numOfSamples = arrayBuffer.byteLength / 2;
      const floatBuffer = new Float32Array(numOfSamples);

      // L16 raw PCM is big-endian
      for (let i = 0; i < numOfSamples; i++) {
        const sample = view.getInt16(i * 2, false);
        floatBuffer[i] = sample / 32768.0;
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      
      const buffer = this.audioCtx.createBuffer(1, numOfSamples, 24000); // 1 channel mono, 24KHz
      buffer.copyToChannel(floatBuffer, 0);

      this.activeAudioSource = this.audioCtx.createBufferSource();
      this.activeAudioSource.buffer = buffer;
      this.activeAudioSource.connect(this.audioCtx.destination);

      this.activeAudioSource.onended = () => {
        this.cleanupAudio();
        onEndedCallback();
        this.resumeListening();
      };

      this.activeAudioSource.start();
    } catch (e) {
      console.error('Error playing raw PCM bytes:', e);
      onEndedCallback();
      this.resumeListening();
    }
  }

  private cleanupAudio() {
    this.activeAudioSource = null;
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
  }

  private fallbackBrowserSpeak(text: string) {
    if (!window.speechSynthesis) {
      this.resumeListening();
      return;
    }

    const langCode = this.language === 'bn' ? 'bn-BD' : 'en-US';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    utterance.onend = () => {
      this.resumeListening();
    };

    window.speechSynthesis.speak(utterance);
  }

  private resumeListening() {
    if (this.isExplicitlyStarted && this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {}
    }
  }

  stopSpeaking() {
    if (this.activeAudioSource) {
      try {
        this.activeAudioSource.stop();
      } catch (e) {}
      this.cleanupAudio();
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}
