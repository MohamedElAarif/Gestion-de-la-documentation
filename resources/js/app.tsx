import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import AppLayout from './Layouts/AppLayout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const pages = import.meta.glob('./pages/**/*.{jsx,tsx}');

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: async (name) => {
        let page: any;
        try {
            page = await resolvePageComponent(`./pages/${name}.jsx`, pages);
        } catch (error) {
            page = await resolvePageComponent(`./pages/${name}.tsx`, pages);
        }

        // Apply the main Layout to all pages except the login page.
        if (name !== 'Auth/Login') {
            page.default.layout = page.default.layout || ((page: any) => <AppLayout>{page}</AppLayout>);
        }

        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
