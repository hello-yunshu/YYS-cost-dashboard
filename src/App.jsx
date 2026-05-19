import { BrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';
import { useRouteElements } from './router';

function App() {
  const routeElements = useRouteElements();

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          {routeElements}
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
