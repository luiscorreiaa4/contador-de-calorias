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
      data: {
        foods: [
          {
            id: '1',
            name: 'Arroz Branco',
            calories: 130,
            proteins: 2.5,
            carbs: 28.1,
            fats: 0.2,
            base_unit: 'g',
            serving_weight: 100,
          },
          {
            id: '2',
            name: 'Ovo de galinha',
            calories: 143,
            proteins: 13,
            carbs: 1.6,
            fats: 8.9,
            base_unit: 'g',
            serving_weight: 100,
            unit_name: 'ovo médio',
            unit_weight: 50,
          },
        ],
        total: 2,
      },
    });
  }),
  
  http.get(`${baseURL}/meals/stats`, ({ request }) => {
    const url = new URL(request.url);
    const period = (url.searchParams.get('period') as 'week' | 'month') || 'week';
    return HttpResponse.json({
      success: true,
      data: {
        period,
        daysLogged: 1,
        totalDays: period === 'week' ? 7 : 30,
        averages: {
          consumed: { calories: 2000, proteins: 150, carbs: 200, fats: 60 },
          goal: { calories: 2200, proteins: 160, carbs: 220, fats: 70 },
        },
        chartData: [
          {
            date: '2026-10-15',
            dayName: 'Hoje',
            consumed_calories: 2000,
            consumed_proteins: 150,
            consumed_carbs: 200,
            consumed_fats: 60,
            goal_calories: 2200,
            goal_proteins: 160,
            goal_carbs: 220,
            goal_fats: 70,
          },
        ],
      },
    });
  }),

  http.post(`${baseURL}/meals`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        name: 'Refeição Nova',
        meal_time: new Date().toISOString(),
        items: [],
      },
    });
  }),

  http.get(`${baseURL}/users/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        goal: 'manter_peso',
        sex: 'masculino',
        birth_date: '1990-01-01',
        weight: 75,
        height: 175,
        body_fat: 15,
        activity_level: 'moderadamente_ativo',
        daily_calories_goal: 2200,
        daily_proteins_goal: 150,
        onboarding_completed: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    });
  }),

  http.get(`${baseURL}/meals/today`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  http.get(`${baseURL}/users/me/goals`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'goal-1',
        user_id: '1',
        effective_from: '2026-01-01',
        calories: 2200,
        proteins: 150,
        carbs: 220,
        fats: 70,
        mode: 'auto',
        created_at: '2026-01-01T00:00:00Z',
      },
    });
  }),

  http.post(`${baseURL}/users/me/preview-goals`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        tmb: 1800,
        tdee: 2400,
        suggestedCalories: 2100,
        suggestedMacros: {
          proteins: 150,
          fats: 65,
          carbs: 230,
        },
      },
    });
  }),

  http.put(`${baseURL}/users/me/onboarding`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        onboarding_completed: true,
      },
    });
  }),

  http.put(`${baseURL}/users/me`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        name: body.name || 'Test User',
        email: 'test@example.com',
        goal: 'perder_peso',
      },
    });
  }),
];
