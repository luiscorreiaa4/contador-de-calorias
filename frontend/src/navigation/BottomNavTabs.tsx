import {
  Activity,
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import {
  NavigationType,
  UNSAFE_LocationContext,
  useLocation,
  useRoutes,
  type Location,
  type RouteObject,
} from 'react-router';
import { RouteLoading } from '../components/layout/RouteLoading';
import { SectionLayout } from '../components/layout/SectionLayout';
import { HISTORICO_TABS } from './nav-items';
import { loadAccountPage, loadDiaryPage, loadStatsPage } from './page-loaders';
import { usePeek } from './peek-context';
import {
  TAB_IDS,
  rememberTabPath,
  resetTabMemory,
  saveTabScroll,
  savedTabScroll,
  tabOwner,
} from './tab-memory';

const DiaryPage = lazy(() => loadDiaryPage().then((m) => ({ default: m.DiaryPage })));
const StatsPage = lazy(() => loadStatsPage().then((m) => ({ default: m.StatsPage })));
const AccountPage = lazy(() => loadAccountPage().then((m) => ({ default: m.AccountPage })));
const MeasurementsPage = lazy(() =>
  import('../pages/private/MeasurementsPage').then((m) => ({ default: m.MeasurementsPage })),
);

const TAB_ROUTES: Record<(typeof TAB_IDS)[number], RouteObject[]> = {
  diario: [
    { path: '/app', element: <DiaryPage /> },
    { path: '/app/diario/:date', element: <DiaryPage /> },
  ],
  historico: [
    {
      path: '/app/historico',
      element: (
        <SectionLayout
          title="Histórico"
          description="Acompanhe sua alimentação, seu peso e suas medidas ao longo do tempo."
          links={HISTORICO_TABS}
        />
      ),
      children: [
        { path: 'alimentacao', element: <StatsPage embedded /> },
        { path: 'corpo', element: <MeasurementsPage embedded /> },
      ],
    },
  ],
  conta: [{ path: '/app/conta', element: <AccountPage /> }],
};

const TabRoutes: FC<{ id: (typeof TAB_IDS)[number] }> = ({ id }) => useRoutes(TAB_ROUTES[id]);

/** Cada aba enxerga a própria localização (a última que visitou), mesmo escondida ou ao lado durante o arrasto. */
const TabScreen: FC<{ id: (typeof TAB_IDS)[number]; location: Location }> = ({ id, location }) => (
  <UNSAFE_LocationContext.Provider value={{ location, navigationType: NavigationType.Pop }}>
    <Suspense fallback={<RouteLoading />}>
      <TabRoutes id={id} />
    </Suspense>
  </UNSAFE_LocationContext.Provider>
);

const DEFAULT_PATH = { diario: '/app', historico: HISTORICO_TABS[0].to, conta: '/app/conta' };

/**
 * Mantém Diário, Histórico e Conta montados (`<Activity>`): trocar de aba não refaz a tela nem as consultas,
 * e a rolagem de cada uma é restaurada. Outras rotas (Metas, Perfil...) usam o `outlet` normal.
 */
export function BottomNavTabs({ outlet }: { outlet: ReactNode }) {
  const location = useLocation();
  const peek = usePeek();
  const owner = tabOwner(location.pathname);
  const [saved, setSaved] = useState<Partial<Record<string, Location>>>({});
  const ownerRef = useRef(owner);

  if (owner && saved[owner] !== location) setSaved({ ...saved, [owner]: location });

  useEffect(() => {
    if (owner) rememberTabPath(owner, location.pathname + location.search);
  }, [owner, location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => {
      if (ownerRef.current) saveTabScroll(ownerRef.current, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      resetTabMemory();
    };
  }, []);

  useLayoutEffect(() => {
    ownerRef.current = owner;
    if (owner) window.scrollTo(0, savedTabScroll(owner));
  }, [owner]);

  return (
    <>
      {TAB_IDS.map((id) => {
        const tabLocation: Location = saved[id] ?? {
          ...location,
          pathname: DEFAULT_PATH[id],
          search: '',
          hash: '',
          key: id,
        };
        return (
          <Activity key={id} mode={owner === id || peek === id ? 'visible' : 'hidden'}>
            <div data-tab={id} className="w-full flex items-center justify-center">
              <TabScreen id={id} location={owner === id ? location : tabLocation} />
            </div>
          </Activity>
        );
      })}
      {/* Telas fora das abas e redirecionamentos (ex.: /app/historico); nas abas o Outlet fica vazio. */}
      {outlet}
    </>
  );
}
