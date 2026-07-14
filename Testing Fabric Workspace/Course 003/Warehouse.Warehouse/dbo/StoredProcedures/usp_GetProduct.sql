CREATE PROC usp_GetProduct @ProductKey INT
AS
SELECT *
FROM dbo.Product
WHERE ProductKey = @ProductKey