import { http, HttpResponse } from 'msw';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const handlers = [
  http.post(`${baseURL}/users/login`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string };
    if (body.email === 'test@example.com' && body.password === '123456') {
      return HttpResponse.json({
        success: true,
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          token: 'fake-token'
        }
      });
    }
    return HttpResponse.json({ success: false, message: 'Credenciais inválidas' }, { status: 400 });
  }),
  
  http.post(`${baseURL}/users/register`, async ({ request }) => {
    const body = await request.json() as { email?: string; name?: string };
    if (body.email === 'test@example.com') {
      return HttpResponse.json({ success: false, message: 'Email já em uso' }, { status: 400 });
    }
    return HttpResponse.json({
      success: true,
      data: {
        user: { id: '1', name: body.name, email: body.email },
        token: 'fake-token'
      }
    });
  }),
  
  http.get(`${baseURL}/foods`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Arroz Branco',
          calories: 130,
          proteins: 2.5,
          carbs: 28.1,
          fats: 0.2,
          base_unit: 'g'
        },
        {
          id: '2',
          name: 'Ovo de galinha',
          calories: 143,
          proteins: 13,
          carbs: 1.6,
          fats: 8.9,
          base_unit: 'g',
          unit_name: 'ovo médio',
          unit_weight: 50
        }
      ]
    });
  }),
  
  http.post(`${baseURL}/meals`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        name: 'Refeição Nova',
        meal_time: new Date().toISOString(),
        items: []
      }
    });
  })
];
