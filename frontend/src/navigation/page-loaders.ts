/** Imports das telas da barra inferior, compartilhados pelo `lazy()` do router e pelo pré-carregamento do swipe. */
export const loadDiaryPage = () => import('../pages/private/DiaryPage');
export const loadStatsPage = () => import('../pages/private/StatsPage');
export const loadAccountPage = () => import('../pages/private/AccountPage');
export const loadCaloriesChart = () => import('../components/charts/CaloriesBarChart');
export const loadMeasurementChart = () => import('../components/charts/MeasurementLineChart');

/** Baixa o código das telas vizinhas antes do swipe, para a troca não esperar a rede. Falha aqui não é erro: o `lazy()` tenta de novo. */
export function preloadBottomNavPages(): void {
  Promise.all([
    loadDiaryPage(),
    loadStatsPage(),
    loadAccountPage(),
    loadCaloriesChart(),
    loadMeasurementChart(),
  ]).catch(() => undefined);
}
