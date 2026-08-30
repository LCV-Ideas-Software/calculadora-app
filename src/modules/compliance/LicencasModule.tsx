/*
 * Copyright © 2026 LCV Ideas & Software
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { useEffect, useState } from 'react';

const LEGAL_PUBLIC_BASE = `${import.meta.env.BASE_URL}legal/`;

const LEGAL_FILES = {
  LICENSE: `${LEGAL_PUBLIC_BASE}LICENSE.txt`,
  NOTICE: `${LEGAL_PUBLIC_BASE}NOTICE.txt`,
  THIRDPARTY: `${LEGAL_PUBLIC_BASE}THIRDPARTY.md`,
  BUNDLED_NOTICES: `${LEGAL_PUBLIC_BASE}THIRD-PARTY-NOTICES.json`,
} as const;

type DocsState = {
  LICENSE: string;
  NOTICE: string;
  THIRDPARTY: string;
  BUNDLED_NOTICES: string;
};

type BundledLicenseEntry = {
  name: string;
  version: string;
  identifier: string;
  text: string;
};

function isBundledLicenseEntry(value: unknown): value is BundledLicenseEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<BundledLicenseEntry>;
  return [entry.name, entry.version, entry.identifier, entry.text].every(
    (field) => typeof field === 'string' && field.trim().length > 0,
  );
}

function formatBundledNotices(value: unknown): string {
  if (!Array.isArray(value) || !value.every(isBundledLicenseEntry)) {
    throw new Error('Formato inválido em THIRD-PARTY-NOTICES.json.');
  }
  return value
    .map(({ name, version, identifier, text }) => `${name}@${version}\nSPDX: ${identifier}\n\n${text}`)
    .join('\n\n---\n\n');
}

export function LicencasModule() {
  const [content, setContent] = useState<DocsState>({
    LICENSE: 'Carregando...',
    NOTICE: 'Carregando...',
    THIRDPARTY: 'Carregando...',
    BUNDLED_NOTICES: 'Carregando...',
  });

  useEffect(() => {
    const fetchFile = async (label: keyof DocsState, path: string): Promise<string> => {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Falha ao carregar ${label}: ${response.status}`);
      }
      return response.text();
    };

    const fetchFiles = async () => {
      try {
        const bundledNoticesPromise = import.meta.env.PROD
          ? fetch(LEGAL_FILES.BUNDLED_NOTICES, { cache: 'no-store' }).then(async (response) => {
              if (!response.ok) {
                throw new Error(`Falha ao carregar BUNDLED_NOTICES: ${response.status}`);
              }
              return formatBundledNotices(await response.json());
            })
          : Promise.resolve('O relatório completo é gerado pelo build de produção do Vite.');

        const [licenseText, noticeText, thirdPartyText, bundledNoticesText] = await Promise.all([
          fetchFile('LICENSE', LEGAL_FILES.LICENSE),
          fetchFile('NOTICE', LEGAL_FILES.NOTICE),
          fetchFile('THIRDPARTY', LEGAL_FILES.THIRDPARTY),
          bundledNoticesPromise,
        ]);

        setContent({
          LICENSE: licenseText,
          NOTICE: noticeText,
          THIRDPARTY: thirdPartyText,
          BUNDLED_NOTICES: bundledNoticesText,
        });
      } catch {
        setContent({
          LICENSE: 'Erro ao carregar LICENSE.',
          NOTICE: 'Erro ao carregar NOTICE.',
          THIRDPARTY: 'Erro ao carregar THIRDPARTY.md.',
          BUNDLED_NOTICES: 'Erro ao carregar THIRD-PARTY-NOTICES.json.',
        });
      }
    };

    fetchFiles();
  }, []);

  const sectionStyle = {
    marginBottom: '32px',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const paragraphStyle = {
    margin: '0 0 1rem 0',
    textAlign: 'justify' as const,
    textIndent: '2em',
    lineHeight: 1.8,
    color: '#202124',
  };

  const preStyle = {
    backgroundColor: '#f1f3f4',
    padding: '16px',
    borderRadius: '8px',
    overflowX: 'auto' as const,
    fontSize: '0.85rem',
    color: '#202124',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap' as const,
    wordWrap: 'break-word' as const,
  };

  const renderJustifiedParagraphs = (raw: string) => {
    const paragraphs = raw
      .split(/\r?\n\r?\n+/)
      .map((chunk) => chunk.replace(/\r?\n/g, ' ').trim())
      .filter(Boolean);

    return paragraphs.map((paragraph) => (
      <p key={`${paragraph.slice(0, 48)}-${paragraph.length}`} style={paragraphStyle}>
        {paragraph}
      </p>
    ));
  };

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '32px 16px',
        fontFamily: 'var(--font-family, Inter, sans-serif)',
      }}
    >
      <h1 style={{ color: '#202124', marginBottom: '8px', fontSize: '2rem' }}>
        Conformidade e Licenças (Open Source Compliance)
      </h1>
      <p style={{ color: '#5f6368', marginBottom: '32px' }}>
        Este sistema opera sob a GNU Affero General Public License v3 (AGPLv3), com componentes de terceiros e suas
        licenças devidamente documentados em NOTICE, THIRDPARTY.md e no relatório nativo do bundle.
      </p>

      <section style={sectionStyle}>
        <h2 style={{ color: '#1a73e8', borderBottom: '2px solid #e8eaed', paddingBottom: '8px', marginBottom: '16px' }}>
          GNU AGPLv3 (LICENSE)
        </h2>
        {renderJustifiedParagraphs(content.LICENSE)}
      </section>

      <section style={sectionStyle}>
        <h2 style={{ color: '#1a73e8', borderBottom: '2px solid #e8eaed', paddingBottom: '8px', marginBottom: '16px' }}>
          Avisos de Autoria e Patentes (NOTICE / Apache 2.0)
        </h2>
        {renderJustifiedParagraphs(content.NOTICE)}
      </section>

      <section style={sectionStyle}>
        <h2 style={{ color: '#1a73e8', borderBottom: '2px solid #e8eaed', paddingBottom: '8px', marginBottom: '16px' }}>
          Componentes de Terceiros (THIRDPARTY)
        </h2>
        <pre style={preStyle}>{content.THIRDPARTY}</pre>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ color: '#1a73e8', borderBottom: '2px solid #e8eaed', paddingBottom: '8px', marginBottom: '16px' }}>
          Licenças do bundle do navegador
        </h2>
        <p style={{ color: '#5f6368' }}>
          Relatório completo gerado pelo <code>build.license</code> oficial do Vite para os componentes efetivamente
          empacotados.
          {import.meta.env.PROD && (
            <>
              {' '}
              <a href={LEGAL_FILES.BUNDLED_NOTICES}>Baixar o JSON original.</a>
            </>
          )}
        </p>
        <pre style={preStyle}>{content.BUNDLED_NOTICES}</pre>
      </section>
    </div>
  );
}
