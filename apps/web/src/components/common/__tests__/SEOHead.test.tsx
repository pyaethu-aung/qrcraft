import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import type { SoftwareApplicationJSONLD } from '../../../types/seo';
import SEOHead from '../SEOHead';

describe('SEOHead Component', () => {
    beforeEach(() => {
        // Clear the head before each test to prevent document contamination
        document.head.innerHTML = '';
    });

    it('injects the SoftwareApplication JSON-LD script into the document head', async () => {
        render(
            <HelmetProvider>
                <SEOHead />
            </HelmetProvider>
        );

        await waitFor(() => {
            const script = document.querySelector('script[type="application/ld+json"]');
            expect(script).toBeTruthy();
        });

        const script = document.querySelector('script[type="application/ld+json"]');
        const json = JSON.parse(script?.innerHTML || '{}') as SoftwareApplicationJSONLD;

        expect(json['@context']).toBe('https://schema.org');
        expect(json['@type']).toBe('SoftwareApplication');
        expect(json.name).toBe('QRCraft');
        expect(json.applicationCategory).toBe('UtilitiesApplication');
        expect(json.operatingSystem).toBe('Web');
    });

    it('contains correctly formatted offers object', async () => {
        render(
            <HelmetProvider>
                <SEOHead />
            </HelmetProvider>
        );

        await waitFor(() => {
            const script = document.querySelector('script[type="application/ld+json"]');
            expect(script).toBeTruthy();
        });

        const script = document.querySelector('script[type="application/ld+json"]');
        const json = JSON.parse(script?.innerHTML || '{}') as SoftwareApplicationJSONLD;

        expect(json.offers).toEqual({
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
        });
    });

    it('contains the specified feature list', async () => {
        render(
            <HelmetProvider>
                <SEOHead />
            </HelmetProvider>
        );

        await waitFor(() => {
            const script = document.querySelector('script[type="application/ld+json"]');
            expect(script).toBeTruthy();
        });

        const script = document.querySelector('script[type="application/ld+json"]');
        const json = JSON.parse(script?.innerHTML || '{}') as SoftwareApplicationJSONLD;

        expect(json.featureList).toContain('Client-side generation');
        expect(json.featureList).toContain('Zero-backend');
        expect(json.featureList).toContain('SVG Export');
    });
});
