import { http, HttpResponse } from 'msw';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const GENERIC_EMAIL_MESSAGE =
  'Se os dados estiverem corretos, enviaremos uma mensagem para o e-mail informado.';

const testUser = {
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
  email_verified_at: '2026-01-01T00:00:00Z',
  token_version: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const handlers = [
  http.post(`${baseURL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string };

    if (body.email === 'unverified@example.com' && body.password === 'senha123') {
      return HttpResponse.json(
        {
          success: false,
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Confirme seu e-mail para entrar.',
        },
        { status: 403 }
      );
    }

    if (body.email === 'test@example.com' && body.password === 'senha123') {
      return HttpResponse.json({
        success: true,
        message: 'Login realizado com sucesso!',
        data: {
          user: testUser,
          token: 'fake-token',
        },
      });
    }

    return HttpResponse.json(
      { success: false, message: 'E-mail ou senha incorretos.' },
      { status: 401 }
    );
  }),

  http.post(`${baseURL}/auth/register`, async () => {
    // A4/A6: sempre 202 genérico, sem revelar existência da conta e sem sessão.
    return HttpResponse.json(
      { success: true, message: GENERIC_EMAIL_MESSAGE },
      { status: 202 }
    );
  }),

  http.post(`${baseURL}/auth/verify-email`, async ({ request }) => {
    const body = await request.json() as { email?: string; code?: string };

    if (body.code !== '123456') {
      return HttpResponse.json(
        {
          success: false,
          code: 'INVALID_VERIFICATION_CODE',
          message: 'Código inválido ou expirado.',
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'E-mail verificado com sucesso!',
      data: {
        user: { ...testUser, email: body.email ?? testUser.email },
        token: 'verified-token',
      },
    });
  }),

  http.post(`${baseURL}/auth/resend-code`, () => {
    return HttpResponse.json(
      { success: true, message: GENERIC_EMAIL_MESSAGE },
      { status: 202 }
    );
  }),

  http.post(`${baseURL}/auth/forgot-password`, () => {
    return HttpResponse.json(
      { success: true, message: GENERIC_EMAIL_MESSAGE },
      { status: 202 }
    );
  }),

  http.post(`${baseURL}/auth/reset-password`, async ({ request }) => {
    const body = await request.json() as { token?: string; password?: string };

    if (!body.token || body.token.startsWith('invalid')) {
      return HttpResponse.json(
        {
          success: false,
          code: 'INVALID_RESET_TOKEN',
          message: 'Link inválido ou expirado.',
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso. Entre com a nova senha.',
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

  http.get(`${baseURL}/foods/recents`, () => {
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
          base_unit: 'g',
          serving_weight: 100,
        },
      ],
    });
  }),

  http.post(`${baseURL}/foods/custom`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      calories: number;
      proteins: number;
      carbs: number;
      fats: number;
      base_unit?: 'g' | 'ml';
      serving_weight?: number;
      unit_name?: string;
      unit_weight?: number;
    };
    return HttpResponse.json(
      {
        success: true,
        message: 'Alimento personalizado cadastrado com sucesso!',
        data: {
          id: `custom-${Date.now()}`,
          name: body.name,
          calories: body.calories,
          proteins: body.proteins,
          carbs: body.carbs,
          fats: body.fats,
          base_unit: body.base_unit || 'g',
          serving_weight: body.serving_weight || 100,
          unit_name: body.unit_name || null,
          unit_weight: body.unit_weight || null,
          source: 'custom',
        },
      },
      { status: 201 }
    );
  }),

  http.get(`${baseURL}/foods/favorites`, () => {
    return HttpResponse.json({
      success: true,
      data: [
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
    });
  }),

  http.post(`${baseURL}/foods/:id/favorite`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Alimento adicionado aos favoritos.',
    });
  }),

  http.delete(`${baseURL}/foods/:id/favorite`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Alimento removido dos favoritos.',
    });
  }),

  http.get(`${baseURL}/saved-meals`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'saved-1',
          user_id: '1',
          name: 'Café Matinal',
          created_at: '2026-10-15T08:00:00Z',
          updated_at: '2026-10-15T08:00:00Z',
          total_calories: 273,
          total_proteins: 15.5,
          items: [
            {
              id: 'item-1',
              saved_meal_id: 'saved-1',
              food_id: '1',
              food_name: 'Arroz Branco',
              food_base_unit: 'g',
              quantity: 100,
              unit: 'g',
              calories: 130,
              proteins: 2.5,
              carbs: 28.1,
              fats: 0.2,
            },
            {
              id: 'item-2',
              saved_meal_id: 'saved-1',
              food_id: '2',
              food_name: 'Ovo de galinha',
              food_base_unit: 'g',
              quantity: 100,
              unit: 'g',
              calories: 143,
              proteins: 13,
              carbs: 1.6,
              fats: 8.9,
            },
          ],
        },
      ],
    });
  }),

  http.post(`${baseURL}/saved-meals`, async ({ request }) => {
    const body = (await request.json()) as { name: string };
    return HttpResponse.json({
      success: true,
      message: 'Combo salvo com sucesso!',
      data: {
        id: 'saved-new',
        name: body.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
        total_calories: 0,
        total_proteins: 0,
      },
    });
  }),

  http.delete(`${baseURL}/saved-meals/:id`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Combo excluído com sucesso!',
    });
  }),

  http.get(`${baseURL}/users/me/measurements`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 'meas-1',
          user_id: '1',
          weight: 80.0,
          body_fat: 18.0,
          measured_at: '2026-10-01T08:00:00Z',
          created_at: '2026-10-01T08:00:00Z',
        },
        {
          id: 'meas-2',
          user_id: '1',
          weight: 79.2,
          body_fat: 17.5,
          measured_at: '2026-10-10T08:00:00Z',
          created_at: '2026-10-10T08:00:00Z',
        },
      ],
    });
  }),

  http.post(`${baseURL}/users/me/measurements`, async ({ request }) => {
    const body = (await request.json()) as { weight: number; body_fat?: number; measured_at?: string };
    return HttpResponse.json({
      success: true,
      data: {
        id: 'meas-new',
        user_id: '1',
        weight: body.weight,
        body_fat: body.body_fat ?? null,
        measured_at: body.measured_at || new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      message: 'Medição registrada com sucesso.',
    });
  }),

  http.get(`${baseURL}/push/public-key`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
      },
    });
  }),

  http.post(`${baseURL}/push/subscribe`, () => {
    return HttpResponse.json(
      {
        success: true,
        message: 'Inscrição push registrada com sucesso.',
      },
      { status: 201 }
    );
  }),

  http.post(`${baseURL}/push/unsubscribe`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Inscrição push cancelada com sucesso.',
    });
  }),

  http.post(`${baseURL}/push/test`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Lembrete enviado com sucesso!',
      data: {
        sent: true,
        recipientCount: 1,
        message: 'Notificação teste despachada com sucesso.',
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

  http.post(`${baseURL}/meals/copy`, async ({ request }) => {
    const body = (await request.json()) as { sourceMealId?: string; sourceDate?: string; targetDate: string };
    if (body.sourceMealId) {
      return HttpResponse.json({
        success: true,
        message: 'Refeição copiada com sucesso!',
        data: {
          id: 'copied-meal-1',
          name: 'Almoço Copiado',
          meal_time: `${body.targetDate}T12:00:00.000Z`,
          items: [],
          total_calories: 500,
          total_proteins: 30,
        },
      });
    }
    return HttpResponse.json({
      success: true,
      message: 'Refeições do dia copiadas com sucesso!',
      data: [
        {
          id: 'copied-meal-1',
          name: 'Almoço Copiado',
          meal_time: `${body.targetDate}T12:00:00.000Z`,
          items: [],
          total_calories: 500,
          total_proteins: 30,
        },
      ],
    });
  }),

  http.get(`${baseURL}/users/me`, () => {
    return HttpResponse.json({
      success: true,
      data: testUser,
    });
  }),

  http.get(`${baseURL}/users/me/export`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        exported_at: '2026-10-19T12:00:00.000Z',
        schema_version: '1.0',
        profile: { id: '1', name: 'Test User', email: 'test@example.com' },
        goals: [],
        body_measurements: [],
        meals: [],
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
