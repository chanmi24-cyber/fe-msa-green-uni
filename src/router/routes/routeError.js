import ErrorView from '@/views/ErrorView.vue'

export const errorRoutes = [   // ← 여기를 'export default ['에서 'export const errorRoutes = ['로
  {
    path: '/error/forbidden',
    name: 'Forbidden',
    component: ErrorView,
    props: { type: 'forbidden', theme: 'sage' },
    meta: { public: true },
  },
  {
    path: '/error/server',
    name: 'ServerError',
    component: ErrorView,
    props: { type: 'server', theme: 'sage' },
    meta: { public: true },
  },
  {
    path: '/error/maintenance',
    name: 'Maintenance',
    component: ErrorView,
    props: { type: 'maintenance', theme: 'sage' },
    meta: { public: true },
  },
  // 404 catch-all
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: ErrorView,
    props: { type: 'not_found', theme: 'sage' },
    meta: { public: true },
  },
]