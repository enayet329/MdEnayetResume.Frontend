import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../Services/chat.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px) scale(0.95)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ])
  ]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('typingIndicator') typingIndicator!: ElementRef;
  userMessage: string = '';
  messages: ChatMessage[] = [];
  isTyping: boolean = false;
  isSending: boolean = false;
  currentStreamingMessage: ChatMessage | null = null;
  selectedTab: number = 0;
  suggestions: string[] = [
    "Give me a 60-second intro to Enayet",
    "What are your top technical skills?",
    "What recent R&D have you done?",
    "What are you learning right now?",
    "What domains interest you next (OTA, fintech, etc.)?"
  ];
  private messageUpdateSubject = new Subject<string>();
  particleStyles: { left: string, duration: string, delay: string }[] = [];
  bubbleStyles: { left: string, duration: string, delay: string }[] = [];
  shapeStyles: { left: string, duration: string, delay: string, class: string }[] = [];
  starStyles: { left: string, duration: string, delay: string }[] = [];

  constructor(
    private chatService: ChatService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.messageUpdateSubject.pipe(debounceTime(20)).subscribe(chunk => {
      console.log('Received chunk:', chunk);
      if (this.currentStreamingMessage) {
        this.currentStreamingMessage.content += chunk;
        this.ngZone.run(() => {
          this.scrollToBottom();
          this.cdr.detectChanges();
        });
      }
    });

    // Precompute styles for particles, bubbles, shapes, and stars
    this.particleStyles = Array.from({ length: 60 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      duration: `${12 + Math.random() * 12}s`,
      delay: `-${i * 0.5}s`
    }));
    this.bubbleStyles = Array.from({ length: 25 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      duration: `${18 + Math.random() * 18}s`,
      delay: `-${i * 1.2}s`
    }));
    this.shapeStyles = Array.from({ length: 15 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      duration: `${25 + Math.random() * 15}s`,
      delay: `-${i * 2}s`,
      class: `shape ${['triangle', 'square', 'diamond'][Math.floor(Math.random() * 3)]}`
    }));
    this.starStyles = Array.from({ length: 50 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      duration: `${3 + Math.random() * 4}s`,
      delay: `-${i * 0.8}s`
    }));
  }

  ngOnInit() {
    this.messages.push({
      id: this.generateId(),
      content: "Hey vai! I'm Enayet, a backend dev from Dhaka. What's up? 😎",
      isUser: false,
      timestamp: new Date()
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  @HostListener('window:resize')
  onResize() {
    this.adjustForKeyboard();
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
    if (this.isTyping && this.typingIndicator) {
      this.typingIndicator.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }

  sendMessage(): void {
    if (!this.userMessage.trim() || this.isSending) return;
    const userMessageContent = this.userMessage.trim();
    const userMsg: ChatMessage = {
      id: this.generateId(),
      content: userMessageContent,
      isUser: true,
      timestamp: new Date()
    };
    this.messages.push(userMsg);
    this.userMessage = '';
    this.isSending = true;
    this.isTyping = true;

    const aiMsg: ChatMessage = {
      id: this.generateId(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      isStreaming: true
    };

    this.messages.push(aiMsg);
    this.currentStreamingMessage = aiMsg;
    this.scrollToBottom();
    this.cdr.detectChanges();

    const req = { userMessage: userMessageContent };
    this.ngZone.runOutsideAngular(() => {
      this.chatService.streamChat(req).subscribe({
        next: (chunk: string) => {
          if (chunk) {
            this.messageUpdateSubject.next(chunk);
          }
        },
        error: (err) => {
          this.ngZone.run(() => {
            console.error('Chat error:', err);
            if (this.currentStreamingMessage) {
              this.currentStreamingMessage.content = '⚠️ Sorry, something went wrong, vai. Try again! 😅';
              this.currentStreamingMessage.isStreaming = false;
            }
            this.isSending = false;
            this.isTyping = false;
            this.currentStreamingMessage = null;
            this.scrollToBottom();
            this.cdr.detectChanges();
          });
        },
        complete: () => {
          this.ngZone.run(() => {
            console.log('Stream completed');
            if (this.currentStreamingMessage) {
              this.currentStreamingMessage.isStreaming = false;
            }
            this.isSending = false;
            this.isTyping = false;
            this.currentStreamingMessage = null;
            this.scrollToBottom();
            this.cdr.detectChanges();
            setTimeout(() => {
              if (this.messageInput) {
                this.messageInput.nativeElement.focus();
              }
            }, 100);
          });
        }
      });
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  renderMarkdown(content: string): SafeHtml {
    // Split content into lines and handle numbered points
    const lines = content.split('\n').map(line => line.trim());
    let formattedContent = '';
    let inList = false;

    lines.forEach(line => {
      // Match lines starting with numbers like "1.", "2.", etc.
      const pointMatch = line.match(/^(\d+)\.\s*(.*)$/);
      if (pointMatch) {
        if (!inList) {
          formattedContent += '<ul style="padding-left: 20px; list-style-type: decimal;">';
          inList = true;
        }
        formattedContent += `<li>${pointMatch[2]}</li>`;
      } else {
        if (inList) {
          formattedContent += '</ul>';
          inList = false;
        }
        // Handle other markdown (bold, italic, code)
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
        line = line.replace(/`(.*?)`/g, '<code>$1</code>');
        line = line.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        formattedContent += `<p>${line}</p>`;
      }
    });

    if (inList) {
      formattedContent += '</ul>';
    }

    // Replace newlines with <br> for non-list content
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(formattedContent);
  }

  copyMessage(content: string): void {
    navigator.clipboard.writeText(content);
  }

  startNewChat(): void {
    this.messages = [
      {
        id: this.generateId(),
        content: "Hey vai! I'm Enayet, a backend dev from Dhaka. What's up? 😎",
        isUser: false,
        timestamp: new Date()
      }
    ];
    this.userMessage = '';
    this.isTyping = false;
    this.isSending = false;
    this.currentStreamingMessage = null;
    this.selectedTab = 0;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.messageInput) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  rerunMessage(message: ChatMessage): void {
    this.userMessage = message.content;
    this.sendMessage();
  }

  sendSuggestion(suggestion: string): void {
    this.userMessage = suggestion;
    this.sendMessage();
  }

  adjustForKeyboard(): void {
    setTimeout(() => {
      this.scrollToBottom();
      if (this.messageInput) {
        this.messageInput.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 300);
  }
}