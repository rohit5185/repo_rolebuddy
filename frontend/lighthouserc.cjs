/** @type {import('@lhci/cli').LHCI.ServerCommand.Options & import('@lhci/cli').LHCI.CiCommand.Options} */
module.exports = {
  ci: {
    collect: {
      url: [
        `${process.env.LHCI_BASE_URL || "http://127.0.0.1:3000"}/login`,
        `${process.env.LHCI_BASE_URL || "http://127.0.0.1:3000"}/signup`
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--no-sandbox --headless=new"
      }
    },
    assert: {
      assertions: {
        "categories:seo": ["error", { minScore: 0.8 }]
      }
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports"
    }
  }
};
