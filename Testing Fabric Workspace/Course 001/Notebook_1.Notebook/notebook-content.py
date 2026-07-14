# Fabric notebook source

# METADATA ********************

# META {
# META   "kernel_info": {
# META     "name": "synapse_pyspark"
# META   },
# META   "dependencies": {
# META     "lakehouse": {
# META       "default_lakehouse": "0c4052a4-3694-4bf5-989c-839358ac92cb",
# META       "default_lakehouse_name": "lk_FAIAD",
# META       "default_lakehouse_workspace_id": "77b56f8d-cd4a-49ba-a22b-e0f91f558ccd",
# META       "known_lakehouses": [
# META         {
# META           "id": "0c4052a4-3694-4bf5-989c-839358ac92cb"
# META         }
# META       ]
# META     }
# META   }
# META }

# CELL ********************

# Welcome to your new notebook
# Type here in the cell editor to add code!
!pip install prophet

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

from pyspark.sql import SparkSession
from pyspark.sql.functions import month, year, col
from prophet import Prophet
import pandas as pd

# Initialize Spark session
spark = SparkSession.builder.appName("Prophet Forecasting").getOrCreate()

# Load data from your specific Spark table
df = spark.sql("SELECT * FROM lk_FAIAD.Invoices i JOIN lk_FAIAD.InvoiceLineItems il ON i.InvoiceID = il.InvoiceID")

# Aggregate data to monthly level
monthly_df = df.withColumn("Month", month("InvoiceDate"))\
               .withColumn("Year", year("InvoiceDate"))\
               .groupBy("Year", "Month")\
               .sum("Quantity")\
               .orderBy("Year", "Month")

# Convert to Pandas DataFrame and prepare for Prophet
pandas_df = monthly_df.toPandas()
pandas_df['ds'] = pd.to_datetime(pandas_df[['Year', 'Month']].assign(DAY=1))
pandas_df['y'] = pandas_df['sum(Quantity)']

# Fit the Prophet model
model = Prophet(yearly_seasonality=True, weekly_seasonality=False,daily_seasonality=False)
model.fit(pandas_df[['ds', 'y']])

# Create a DataFrame for future predictions (e.g., next 12 months)
future = model.make_future_dataframe(periods=12, freq='M')

# Forecast
forecast = model.predict(future)

# Plotting the forecast
model.plot(forecast)
model.plot_components(forecast)  


# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

display(forecast)
#write forecast data to a table
spark.createDataFrame(forecast).write.saveAsTable("Sales_Forecast", mode="overwrite")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df = spark.sql("SELECT * FROM lk_FAIAD.sales_forecast LIMIT 1000")
display(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
