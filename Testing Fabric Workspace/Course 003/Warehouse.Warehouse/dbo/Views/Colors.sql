-- Auto Generated (Do not modify) 0368C71E246B02AA4C6F2B629B926D2923C2BC9FFA1DA651901CE840EC15327C
CREATE VIEW [dbo].[Colors] AS SELECT Color
FROM dbo.FactInternetSales AS FIS
	JOIN dbo.Product AS P
		ON P.ProductKey = FIS.ProductKey