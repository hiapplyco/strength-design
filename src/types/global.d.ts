interface Window {
  gtagSendEvent: () => boolean;
  dataLayer: any[];
  gtag: (...args: any[]) => void;
}