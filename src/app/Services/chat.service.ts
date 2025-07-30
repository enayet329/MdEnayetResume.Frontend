import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://enayethossainresumeai.somee.com/api/Chat';

  constructor() {}

  streamChat(request: any): Observable<string> {
    return new Observable<string>(observer => {
      const controller = new AbortController();

      fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(60000), // Increase to 60 seconds
        credentials: 'include' // Ensure session cookies are sent
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        function read() {
          reader.read().then(({ done, value }) => {
            if (done) {
              observer.complete();
              return;
            }

            const chunk = decoder.decode(value, { stream: true });
            observer.next(chunk); // Emit chunk as-is
            read();
          }).catch(err => {
            observer.error(err);
            reader.cancel().catch(() => {});
          });
        }

        read();
      }).catch(err => observer.error(err));

      return () => controller.abort();
    });
  }
}