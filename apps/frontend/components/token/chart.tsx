"use client"

import { TokenBase } from "@/lib/api/token";
import { Card, CardContent } from "../ui/card";
import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  widget,
} from "@/public/static/charting_library";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";

const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
  interval: "1D" as ResolutionString,
  library_path: "/static/charting_library/",
  locale: "en",
  charts_storage_url: "https://saveload.tradingview.com",
  charts_storage_api_version: "1.1",
  client_id: "tradingview.com",
  user_id: "public_user_id",
  fullscreen: false,
  autosize: true,
}

export default function TokenChart({
  token,
}: {
  token?: TokenBase | null,
}) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const widgetProps: Partial<ChartingLibraryWidgetOptions> = {
    symbol: "DNCE", // token?.ticker,
    ...defaultWidgetProps,
  }

  return (
    <>
      <Script
        src="/static/datafeeds/udf/dist/bundle.js"
        strategy="lazyOnload"
        onReady={() => {
          setIsScriptReady(true);
        }}
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
			datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(
				process.env.NEXT_PUBLIC_MARKET_DATA_URL,
				undefined,
				{
					maxResponseLength: 1000,
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
			client_id: props.client_id,
			user_id: props.user_id,
			fullscreen: props.fullscreen,
			autosize: props.autosize
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
    <Card>
      <CardContent ref={chartContainerRef} className="min-h-[500px]" />
    </Card>
	);
};