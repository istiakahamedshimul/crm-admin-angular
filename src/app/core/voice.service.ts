import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Lead } from '../models/crm.models';
import { environment } from '../../environments/environment';

const GEMINI_API_KEY = environment.geminiApiKey || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export interface PerformanceReport {
  name: string;
  leadsGiven: number;
  booked: number;
  lost: number;
  notInterested: number;
  assignedStage: number;
  detailsText: string;
}

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

  private activePerformanceReportSubject = new BehaviorSubject<PerformanceReport | null>(null);
  activePerformanceReport$: Observable<PerformanceReport | null> = this.activePerformanceReportSubject.asObservable();

  // Active language code: 'en' for English, 'bn' for Bengali
  language: 'en' | 'bn' = 'en';

  private recognition: any;
  private currentSpeechUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.initSpeechRecognition();
  }

  toggleLanguage() {
    this.language = this.language === 'en' ? 'bn' : 'en';
    if (this.recognition) {
      this.recognition.lang = this.language === 'bn' ? 'bn-BD' : 'en-US';
    }
  }

  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.errorSubject.next('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.language === 'bn' ? 'bn-BD' : 'en-US';

    this.recognition.onstart = () => {
      this.listeningSubject.next(true);
      this.errorSubject.next(null);
      this.stopSpeaking();
    };

    this.recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      this.processingSubject.next(true);
      this.parseCommandWithGemini(speechText);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.errorSubject.next('Microphone permission denied. Please allow mic access.');
      } else {
        this.errorSubject.next(`Speech capture failed: ${event.error}`);
      }
      this.listeningSubject.next(false);
      this.processingSubject.next(false);
    };

    this.recognition.onend = () => {
      this.listeningSubject.next(false);
    };
  }

  startListening() {
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
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  speak(text: string, langCode: string) {
    this.stopSpeaking();

    if (!window.speechSynthesis) return;

    this.currentSpeechUtterance = new SpeechSynthesisUtterance(text);
    this.currentSpeechUtterance.lang = langCode;
    
    // Choose a suitable voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
      if (matchingVoice) {
        this.currentSpeechUtterance.voice = matchingVoice;
      }
    }

    window.speechSynthesis.speak(this.currentSpeechUtterance);
  }

  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  closePerformanceReport() {
    this.activePerformanceReportSubject.next(null);
    this.stopSpeaking();
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
3. "unknown": If the command is not understood.

Response format:
- "spokenResponse": A short spoken confirmation in the user's language. If the user spoke in Bengali, return it in Bengali (Bangla unicode text). If in English, return in English.
  Examples:
  - English: "Opening the Leads page."
  - Bengali: "লিড পেইজ খোলা হচ্ছে।" or "এখানে ইশতিয়াকের পারফরম্যান্সের বিবরণ দেওয়া হলো।"

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
      const unknownMsg = this.language === 'bn'
        ? `আমি দুঃখিত, আমি এই কমান্ডটি বুঝতে পারিনি: "${originalSpeech}"`
        : `Sorry, I did not understand the command: "${originalSpeech}"`;
      this.speak(unknownMsg, langCode);
    }
  }

  private loadPerformanceStats(execName: string, confirmationSpeech: string) {
    this.processingSubject.next(true);

    this.api.leads().subscribe({
      next: (leads: Lead[]) => {
        this.processingSubject.next(false);
        
        const normalizedTarget = execName.toLowerCase().replace(/^(mr|ms|mrs)\.?\s+/i, '');
        const execLeads = leads.filter(l => {
          if (!l.assignedToName) return false;
          const normalizedName = l.assignedToName.toLowerCase();
          return normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName);
        });

        if (execLeads.length === 0) {
          const notFoundMsg = this.language === 'bn'
            ? `আমি দুঃখিত, বিক্রয় নির্বাহী "${execName}" এর কোনো লিড রেকর্ড খুঁজে পাইনি।`
            : `Sorry, I couldn't find any sales records for "${execName}".`;
          this.speak(notFoundMsg, this.language === 'bn' ? 'bn-BD' : 'en-US');
          this.errorSubject.next(`No record found for sales executive "${execName}".`);
          return;
        }

        // Calculate statistics
        const leadsGiven = execLeads.length;
        const booked = execLeads.filter(l => l.status === 9).length; // Booked (index 9)
        const lost = execLeads.filter(l => l.status === 10).length; // Lost (index 10)
        const notInterested = execLeads.filter(l => l.status === 11).length; // Not Interested (index 11)
        const assignedStage = execLeads.filter(l => l.status === 1).length; // Assigned (index 1)

        const officialName = execLeads[0].assignedToName || execName;

        // Construct detailed report text
        let detailsText = '';
        if (this.language === 'bn') {
          detailsText = `${officialName} এর মোট লিড দেওয়া হয়েছে ${leadsGiven}টি। এর মধ্যে ${booked}টি বুকড কাস্টমার, ${lost}টি লস্ট, ${notInterested}টি নট ইন্টারেস্টেড এবং ${assignedStage}টি বর্তমানে অ্যাসাইনড অবস্থায় রয়েছে।`;
        } else {
          detailsText = `${officialName} has been given ${leadsGiven} total leads. Out of these, ${booked} are booked customers, ${lost} are lost, ${notInterested} are not interested, and ${assignedStage} are currently in the assigned stage.`;
        }

        // Trigger confirmation + stats speech
        const finalSpeech = `${confirmationSpeech} ${detailsText}`;
        this.speak(finalSpeech, this.language === 'bn' ? 'bn-BD' : 'en-US');

        // Set the report to display visually
        this.activePerformanceReportSubject.next({
          name: officialName,
          leadsGiven,
          booked,
          lost,
          notInterested,
          assignedStage,
          detailsText
        });
      },
      error: (err) => {
        console.error('Failed to load leads statistics:', err);
        this.processingSubject.next(false);
        this.errorSubject.next('Failed to retrieve performance metrics.');
      }
    });
  }
}
