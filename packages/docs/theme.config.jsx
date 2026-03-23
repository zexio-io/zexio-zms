export default {
  logo: <span>Zexio ZMS Docs</span>,
  project: {
    link: 'https://github.com/zexio-io/zexio-zms',
  },
  docsRepositoryBase: 'https://github.com/zexio-io/zexio-zms/tree/main/packages/docs',
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="ZMS Docs" />
      <meta property="og:description" content="The Open-Source Zero-Trust Secret Manager" />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: '%s – ZMS'
    }
  },
  footer: {
    text: (
      <span>
        MIT {new Date().getFullYear()} ©{' '}
        <a href="https://zexio.io" target="_blank">
          Zexio
        </a>.
      </span>
    )
  }
}
