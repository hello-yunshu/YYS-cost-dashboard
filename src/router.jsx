import { lazy, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard/index'));
const BranchDetail = lazy(() => import('./pages/Dashboard/BranchView'));
const Annual = lazy(() => import('./pages/Annual/index'));
const Admin = lazy(() => import('./pages/Admin/index'));

export function useRouteElements() {
  const elements = useMemo(() => (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/branch/:id" element={<BranchDetail />} />
      <Route path="/annual" element={<Annual />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  ), []);

  return elements;
}
