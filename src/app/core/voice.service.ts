import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserSummary } from '../models/crm.models';
import { environment } from '../../environments/environment';

const GEMINI_API_KEY = environment.geminiApiKey || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
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
  private currentSpeechUtterance: SpeechSynthesisUtterance | null = null;
  private isExplicitlyStarted = false; // Flag to maintain continuous listening state

  constructor() {
    this.initSpeechRecognition();
  }

  toggleLanguage() {
    this.language = this.language === 'en' ? 'bn' : 'en';
    if (this.recognition) {
      this.recognition.lang = this.language === 'bn' ? 'bn-BD' : 'en-US';
      // If recognition is currently running, restart it to apply the new language settings
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
    this.recognition.continuous = true; // Stay active to receive multiple sentences
    this.recognition.interimResults = false;
    this.recognition.lang = this.language === 'bn' ? 'bn-BD' : 'en-US';

    this.recognition.onstart = () => {
      this.listeningSubject.next(true);
      this.errorSubject.next(null);
    };

    this.recognition.onresult = (event: any) => {
      // Get the latest finalized transcript segment
      const resultIndex = event.resultIndex;
      const speechText = event.results[resultIndex][0].transcript.trim();
      
      if (speechText) {
        this.processingSubject.next(true);
        this.parseCommandWithGemini(speechText);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.errorSubject.next('Microphone permission denied. Please allow mic access.');
        this.isExplicitlyStarted = false;
        this.listeningSubject.next(false);
      } else if (event.error === 'aborted') {
        // Normal state when manually stopped or reset
      } else {
        this.errorSubject.next(`Speech capture: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      // If the user did not click to stop, automatically restart listening
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

  speak(text: string, langCode: string) {
    this.stopSpeaking();

    if (!window.speechSynthesis) return;

    this.currentSpeechUtterance = new SpeechSynthesisUtterance(text);
    this.currentSpeechUtterance.lang = langCode;
    
    // Setup natural non-robotic rate & pitch
    this.currentSpeechUtterance.rate = 1.0;
    this.currentSpeechUtterance.pitch = 1.05;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
      if (matchingVoice) {
        this.currentSpeechUtterance.voice = matchingVoice;
      }
    }

    // Temporarily pause listening while the assistant speaks to avoid feedback echo
    if (this.isExplicitlyStarted && this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    this.currentSpeechUtterance.onend = () => {
      // Resume listening once speech synthesis finishes
      if (this.isExplicitlyStarted && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {}
      }
    };

    window.speechSynthesis.speak(this.currentSpeechUtterance);
  }

  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  private parseCommandWithGemini(speechText: string) {
    const systemPrompt = `You are a voice command assistant for a Real Estate CRM Admin Panel.
Your job is to analyze the user's spoken command (which can be in English or Bengali/Bangla) and parse it into a structured JSON action.

The available pages/routes in the application are:
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

Actions:
1. "navigate": If the user wants to go/navigate/open a specific page (e.g. "go to leads", "লিড পেইজ ওপেন করো"). Set "target" to the matching route path from the list above.
2. "view_performance": If the user wants to see the sales performance, reports, bookings, or statistics of a sales executive (e.g. "show me Mr John's performance", "ইশতিয়াক এর পারফরম্যান্স দেখতে চাই").
   - Set "target" to the name of the sales executive in English (e.g. "John", "Istiak", "Demo Sales Executive") so it matches our system records.
3. "unknown": If the command is not supported or not understood.
   - For unsupported requests, set "spokenResponse" to:
     - English: "I'm sorry, I cannot perform that action."
     - Bengali: "আমি দুঃখিত, আমি এটি করতে পারছি না।"

Response format:
- "spokenResponse": A short spoken confirmation in the user's language. If the user spoke in Bengali, return it in Bengali (Bangla unicode text). If in English, return in English.
  Examples:
  - English: "Opening the profile details."
  - Bengali: "প্রোফাইল বিবরণ খোলা হচ্ছে।"

Return ONLY a valid JSON object matching this TypeScript type:
{
  "action": "navigate" | "view_performance" | "unknown";
  "target": string;
  "spokenResponse": string;
}
Do not include any markdown formatting, backticks (like \`\`\`json), or explanatory text. Return raw JSON text only.

User Spoken Command: "${speechText}"`;

    const requestBody = {
      contents: [{
        parts: [{ text: systemPrompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    this.http.post<any>(GEMINI_URL, requestBody).subscribe({
      next: (response) => {
        this.processingSubject.next(false);
        try {
          const rawText = response.candidates[0].content.parts[0].text;
          const parsed = JSON.parse(rawText.trim());
          this.executeParsedAction(parsed, speechText);
        } catch (e) {
          console.error('Failed to parse Gemini response', e);
          this.errorSubject.next('Failed to process command intent.');
        }
      },
      error: (err) => {
        console.error('Gemini API Error:', err);
        this.processingSubject.next(false);
        this.errorSubject.next('Failed to connect to AI voice processor.');
      }
    });
  }

  private executeParsedAction(intent: { action: string; target: string; spokenResponse: string }, originalSpeech: string) {
    const langCode = this.language === 'bn' ? 'bn-BD' : 'en-US';

    if (intent.action === 'navigate') {
      this.speak(intent.spokenResponse, langCode);
      this.router.navigateByUrl(intent.target);
    } else if (intent.action === 'view_performance') {
      this.loadPerformanceStats(intent.target, intent.spokenResponse);
    } else {
      const unknownMsg = intent.spokenResponse || (this.language === 'bn'
        ? `আমি দুঃখিত, আমি এটি করতে পারছি না।`
        : `I'm sorry, I cannot do this.`);
      this.speak(unknownMsg, langCode);
    }
  }

  private loadPerformanceStats(execName: string, confirmationSpeech: string) {
    this.processingSubject.next(true);

    this.api.users().subscribe({
      next: (users: UserSummary[]) => {
        const normalizedTarget = execName.toLowerCase().replace(/^(mr|ms|mrs)\.?\s+/i, '');
        const matchedUser = users.find(u => {
          if (u.role !== 'SalesExecutive') return false;
          const name = u.fullName.toLowerCase();
          return name.includes(normalizedTarget) || normalizedTarget.includes(name);
        });

        if (!matchedUser) {
          this.processingSubject.next(false);
          const notFoundMsg = this.language === 'bn'
            ? `আমি দুঃখিত, আমি এটি করতে পারছি না। বিক্রয় নির্বাহী "${execName}" এর কোনো তথ্য খুঁজে পাইনি।`
            : `I'm sorry, I cannot do this. I couldn't find any sales records for "${execName}".`;
          this.speak(notFoundMsg, this.language === 'bn' ? 'bn-BD' : 'en-US');
          this.errorSubject.next(`No record found for sales executive "${execName}".`);
          return;
        }

        // Load the details for metrics calculation
        this.api.salesExecutiveDetail(matchedUser.id).subscribe({
          next: (detail) => {
            this.processingSubject.next(false);

            const leadsGiven = detail.metrics.totalAssignedLeads;
            const booked = detail.metrics.positiveCustomers;
            const lost = detail.metrics.lost;
            const notInterested = detail.metrics.notInterested;
            const assignedStage = detail.metrics.assignedStage;

            // Construct detailed report text in natural tones
            let detailsText = '';
            if (this.language === 'bn') {
              detailsText = `বিক্রয় নির্বাহী ${detail.fullName} এর পারফরম্যান্সের বিবরণ এখানে রয়েছে। তিনি মোট ${leadsGiven}টি লিড পেয়েছেন। তার মধ্যে ${booked} জন বুকড কাস্টমার, ${lost} জন লস্ট এবং ${notInterested} জন নট ইন্টারেস্টেড হিসেবে আছেন। এছাড়া বর্তমানে ${assignedStage}টি লিড অ্যাসাইনড অবস্থায় রয়েছে।`;
            } else {
              detailsText = `Here is a summary of the performance for sales executive ${detail.fullName}. They have received a total of ${leadsGiven} leads. Among these, ${booked} are booked customers, ${lost} are lost, and ${notInterested} are not interested. Additionally, ${assignedStage} leads are currently in the assigned stage.`;
            }

            // Trigger natural speech synthesis
            const finalSpeech = `${confirmationSpeech} ${detailsText}`;
            this.speak(finalSpeech, this.language === 'bn' ? 'bn-BD' : 'en-US');

            // Emit executive id and navigate to /users page
            this.autoSelectSalesExecutiveSubject.next(matchedUser.id);
            this.router.navigateByUrl('/users');
          },
          error: (err) => {
            this.processingSubject.next(false);
            console.error('Failed to load sales executive metrics:', err);
            this.errorSubject.next('Failed to retrieve performance details.');
          }
        });
      },
      error: (err) => {
        this.processingSubject.next(false);
        console.error('Failed to load users list:', err);
        this.errorSubject.next('Failed to retrieve sales team list.');
      }
    });
  }
}
