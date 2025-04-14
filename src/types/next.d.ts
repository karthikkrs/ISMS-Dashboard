/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { AppType } from 'next/app';
import { NextPage } from 'next/types';

declare module 'next' {
  /**
   * @future These types will be moved to the appropriate location in the next module
   */
  type GetServerSidePropsContext = {
    params?: {
      [param: string]: string | string[];
    };
    req: Request;
    res: Response;
    query: {
      [param: string]: string | string[];
    };
  };

  type GetServerSidePropsResult<P> = {
    props: P;
    notFound?: boolean;
    redirect?: {
      destination: string;
      permanent: boolean;
    };
  };

  /**
   * Next.js App Component with Layout and SEO customizations.
   */
  export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: React.ReactElement) => React.ReactNode;
  };

  /**
   * Next.js App with additional layout support.
   */
  export type AppPropsWithLayout<P = {}> = {
    Component: NextPageWithLayout;
    pageProps: P;
  };
}
