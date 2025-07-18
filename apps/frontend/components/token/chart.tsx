// https://www.tradingview.com/charting-library-docs/latest/core_concepts/Widget-Constructor
// https://github.com/tradingview/charting-library-examples/blob/master/nextjs/pages/index.tsx
"use client"

import { TokenBase } from "@/lib/api/token";
import { Card, CardContent } from "../ui/card";
import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  widget,
} from "@/public/charting_library";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
  interval: "1D" as ResolutionString,
  library_path: "/charting_library/",
  locale: "en",
  charts_storage_url: "https://saveload.tradingview.com",
  charts_storage_api_version: "1.1",
  fullscreen: false,
  autosize: true,
}

export default function TokenChart({
  token,
}: {
  token: TokenBase,
}) {
  const [isScriptReady, setIsScriptReady] = useState(false)
  const widgetProps: Partial<ChartingLibraryWidgetOptions> = {
    symbol: token.ticker,
    ...defaultWidgetProps,
  }

  return (
    <>
      <Script
        src="/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => setIsScriptReady(true)}
        onLoad={() => setIsScriptReady(true)}
      />
      {isScriptReady && <TVChartContainer {...widgetProps} />}
    </>
  );
}

function TVChartContainer(props: Partial<ChartingLibraryWidgetOptions>) {
  const chartContainerRef =
    useRef<HTMLDivElement>(null) as React.RefObject<HTMLInputElement>

  useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: props.symbol,
      // BEWARE: no trailing slash is expected in feed URL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed( 
        process.env.NEXT_PUBLIC_MARKET_DATA_URL,
        process.env.NEXT_PUBLIC_MARKET_DATA_UPDATE_FREQUENCY,
        {
          maxResponseLength: process.env.NEXT_PUBLIC_MARKET_DATA_MAX_RESPONSE_LENGTH,
          expectedOrder: "latestFirst",
        }
      ),
      interval: props.interval as ResolutionString,
      container: chartContainerRef.current,
      library_path: props.library_path,
      locale: props.locale as LanguageCode,
      disabled_features: ["use_localstorage_for_settings"],
      enabled_features: ["study_templates"],
      charts_storage_url: props.charts_storage_url,
      charts_storage_api_version: props.charts_storage_api_version,
      fullscreen: props.fullscreen,
      autosize: props.autosize,
    };

    const tvWidget = new widget(widgetOptions);

    tvWidget.onChartReady(() => {
      tvWidget.headerReady().then(() => {
        const button = tvWidget.createButton();
        button.setAttribute("title", "Click to show a notification popup");
        button.classList.add("apply-common-tooltip");
        button.addEventListener("click", () =>
          tvWidget.showNoticeDialog({
            title: "Notification",
            body: "TradingView Charting Library API works correctly",
            callback: () => {
              console.log("Noticed!");
            },
          })
        );

        button.innerHTML = "Check API";
      });
    });

    return () => {
      tvWidget.remove();
    };
  }, [props]);

  return (
    <Card className="bg-panel">
      <CardContent
        ref={chartContainerRef}
        className="sm:min-h-[300px] md:min-h-[500px] lg:min-h-[700px]"
      />
    </Card>
  );
};