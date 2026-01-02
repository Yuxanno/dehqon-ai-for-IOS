import { AlertTriangle } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../types';
import clsx from 'clsx';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'chat-bubble',
          isUser ? 'chat-bubble-user' : 'chat-bubble-ai'
        )}
      >
        {/* Изображение, если есть */}
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Загруженное фото"
            className="rounded-lg mb-2 max-w-full max-h-64 object-cover"
          />
        )}

        {/* Текст сообщения */}
        <p className="whitespace-pre-wrap text-sm md:text-base">{message.content}</p>

        {/* Диагнозы с вероятностями */}
        {message.diagnosis && message.diagnosis.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-earth-700">Возможные причины:</p>
            {message.diagnosis.map((d, i) => (
              <div
                key={i}
                className="bg-earth-50 rounded-lg p-3 border border-earth-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-earth-900 text-sm md:text-base">{d.name}</span>
                  <span
                    className={clsx(
                      'text-xs md:text-sm font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                      d.probability >= 70
                        ? 'bg-red-100 text-red-700'
                        : d.probability >= 40
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    )}
                  >
                    {d.probability}%
                  </span>
                </div>
                {d.description && (
                  <p className="text-xs md:text-sm text-earth-600 mt-1">{d.description}</p>
                )}
              </div>
            ))}

            {/* Предупреждение */}
            <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 rounded-lg p-3 text-xs md:text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Это предварительная оценка ИИ. Для точного диагноза обратитесь к
                агроному или отправьте фото растения.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
