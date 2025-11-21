import { createUniformApiEnhancer, RootComponentInstance } from '@uniformdev/canvas';
import { prependLocale, withUniformGetServerSideProps } from '@uniformdev/canvas-next/route';
import { UniformComposition } from '@uniformdev/canvas-react';
import { BreadcrumbsContextProvider } from '@uniformdev/csk-components/components/canvas';
import {
  DesignExtensionsProvider,
  type DesignExtensionsProviderProps,
} from '@uniformdev/design-extensions-tools/components/providers/server';
import { getTokenConfiguration } from '@uniformdev/design-extensions-tools/getTokenConfiguration';
import { componentResolver } from '@/components';
import { getBreadcrumbs, buildPath } from '@/utils/canvas/canvasClients';

export const getServerSideProps = withUniformGetServerSideProps({
  modifyPath: prependLocale,
  handleComposition: async (routeResponse, _context) => {
    const { composition, errors } = routeResponse.compositionApiResponse || {};

    if (errors?.some(e => e.type === 'data' || e.type === 'binding')) {
      return { notFound: true };
    }
    const preview = Boolean(_context.preview);
    const tokenConfiguration = !preview && process.env.WATCH !== 'true' ? null : await getTokenConfiguration();

    const breadcrumbs = await getBreadcrumbs(
      composition,
      buildPath(routeResponse.matchedRoute, routeResponse.dynamicInputs)
    );

    return {
      props: { preview, data: composition || null, tokenConfiguration, breadcrumbs },
    };
  },
});

type PageProps = {
  data: RootComponentInstance;
  preview: boolean;
  breadcrumbs: { title: string; link: string | null }[];
} & Pick<DesignExtensionsProviderProps, 'tokenConfiguration'>;

export default function Page({ data, tokenConfiguration, breadcrumbs, preview }: PageProps) {
  return (
    <DesignExtensionsProvider tokenConfiguration={tokenConfiguration} isPreviewMode={preview}>
      <BreadcrumbsContextProvider breadcrumbs={breadcrumbs}>
        <UniformComposition
          data={data}
          behaviorTracking="onLoad"
          contextualEditingEnhancer={createUniformApiEnhancer({ apiUrl: '/api/preview' })}
          resolveRenderer={componentResolver}
        />
      </BreadcrumbsContextProvider>
    </DesignExtensionsProvider>
  );
}
