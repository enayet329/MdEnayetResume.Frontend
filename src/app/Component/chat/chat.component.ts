import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../Services/chat.service';
import { ChatRequest } from '../../Models/chat-request.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
  userMessage: string = '';
  messages: string[] = [];

  constructor(private chatService: ChatService) {}

  sendMessage() {
    if (!this.userMessage.trim()) return;

    const req: ChatRequest = { userMessage: this.userMessage };
    this.messages.push('🧑: ' + this.userMessage);
    this.userMessage = '';

    this.chatService.streamChat(req).subscribe({
      next: chunks => {
        const botMessage = chunks.join('').trim();
        this.messages.push('🤖: ' + botMessage);
      },
      error: err => {
        console.error('Chat error:', err);
        this.messages.push('⚠️ Chat failed');
      }
    });
  }
}
