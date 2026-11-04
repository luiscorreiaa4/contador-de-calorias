import { z } from 'zod';

// V-6: endpoints de push são sempre https nos navegadores; limitar evita lixo e SSRF futuro.
const pushEndpointSchema = z
  .string()
  .url('Endpoint de notificação inválido.')
  .max(2048, 'Endpoint de notificação inválido.')
  .refine((value) => value.startsWith('https://'), 'Endpoint de notificação inválido.');

export const pushSubscriptionSchema = z
  .object({
    endpoint: pushEndpointSchema,
    keys: z
      .object({
        p256dh: z.string().min(1, 'Chave p256dh é obrigatória.').max(256),
        auth: z.string().min(1, 'Chave auth é obrigatória.').max(256),
      })
      .strict(),
  })
  .strict();

export type PushSubscriptionDTO = z.infer<typeof pushSubscriptionSchema>;

export const unsubscribePushSchema = z.object({ endpoint: pushEndpointSchema }).strict();

export type UnsubscribePushDTO = z.infer<typeof unsubscribePushSchema>;
