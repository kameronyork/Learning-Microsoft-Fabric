# Fabric notebook source

# METADATA ********************

# META {
# META   "kernel_info": {
# META     "name": "synapse_pyspark"
# META   },
# META   "dependencies": {
# META     "lakehouse": {
# META       "default_lakehouse": "e89fe562-bf9d-4217-a07a-db63575125e1",
# META       "default_lakehouse_name": "lh_pySparkODL",
# META       "default_lakehouse_workspace_id": "77b56f8d-cd4a-49ba-a22b-e0f91f558ccd",
# META       "known_lakehouses": [
# META         {
# META           "id": "e89fe562-bf9d-4217-a07a-db63575125e1"
# META         }
# META       ]
# META     }
# META   }
# META }

# MARKDOWN ********************

# # Aggregations in PySpark
# 
# In this lab, you are going to learn how to perform various aggregations using PySPark.
# 
# - Group By
# - Sum
# - Min / Max
# - Count

# MARKDOWN ********************

# ## InternetSales Data
# 
# First, import data from the InternetSales.snappy.parquet file.

# CELL ********************

df = spark.read.load("Files/InternetSales.snappy.parquet", header=True, inferSchema=True, format='parquet')
display(df.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Group By
# 
# - Group by Product Key and count the number of rows within each grouping

# CELL ********************

df.groupBy(df.ProductKey).count().show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Max
# 
# - Return the MAX OrderDateKey per ProductKey

# CELL ********************

df.groupBy(df.ProductKey)\
    .max("OrderDateKey").show() 

    # df.OrderDateKey inside of Max does not work here and throws an error.

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Renaming an aggregated column
# 
# - You can use **withColumnRenamed** to rename the aggregated column

# CELL ********************

df.groupBy(df.ProductKey)\
    .max("OrderDateKey")\
    .withColumnRenamed('max(OrderDateKey)', 'Last_Date').show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Renaming an aggregated column
# 
# - When using the Agg function, you can use **alias** to rename an aggregated column.

# CELL ********************

from pyspark.sql.functions import *

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.groupBy(df.ProductKey)\
    .agg(max("OrderDateKey").alias("Last_Date")).show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### OrderBy
# 
# - You can order the result set also using the **orderBy** function

# CELL ********************

df.groupBy(df.ProductKey)\
    .agg(\
        max("OrderDateKey").alias("Last_Date"),\
        count("OrderDateKey").alias("Total_Sold"))\
    .orderBy("Total_Sold")\
    .show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Creating a Profit column
# 
# Previously you learned how to add columns to a data frame. Now you get to practice that skill.
# 
# **Challenge:**
# 
# In the code cell below, add a **profit** column to your data frame. Profit = SalesAmount - TotalProductCost
# 
# **Hint:**
# 
# - Remember, you can use [DataFrame].columns to get a list of the columns in your DataFrame

# CELL ********************

# Challenge
# df = df.withColumn("profit", col("SalesAmount") - col("TotalProductCost"))
df = df.withColumn("profit", df.SalesAmount - df.TotalProductCost)
display(df.limit(5))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Challenge:
# 
# We want to take a look at the schema of the dataFrame.
# 
# Complete the code cell below to return the Schema which will include the Columns, data types and if they are nullable.

# CELL ********************

# Challenge
df.printSchema()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Cast
# 
# Sometimes you may need to change the data type of a column. As you will see here, you can use CAST to change the datatype of a column.
# 
# _Also, notice that we use withColumn here to actually update an existing column._

# CELL ********************

df = df.withColumn("SalesAmount", df.SalesAmount.cast("integer"))
df.printSchema()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Cast 2
# 
# In the code below, you are going to add a NEW column to the data frame.
# 
# **Challenge:**
# 
# - Create a new column called "SalesAmount_dec"
# - Cast the existing SalesAmount column to a decimal

# CELL ********************

# Challenge
df = df.withColumn("SalesAmount_dec", df.SalesAmount.cast("decimal"))
df.printSchema()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

display(df.limit(5))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Performing Aggregations
# 
# You've previously learned how to perform various select operations. Now you will learn how to perform aggregations.
# 
# - Sum
# - Group By
# 
# **Lab Example:**
# 
# The code example below shows an example of using a SUM and group by in PySpark

# CELL ********************

df_agg = \
df.select(col("ProductKey").alias("Product"), col("SalesAmount").alias("Sales"), col("TotalProductCost"), col("Profit"))\
.groupBy("Product")\
.agg(\
    sum("Sales").alias("TotalSales"))
df_agg.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# **Challenge:**
# 
# Let's continue to add additional aggregations to our new dataframe.
# 
# - Sum TotalProductCost as TotalCost
# - Sum Profit as TotalProfit
# - Max OrderDate as LastOrderDate
# - Count Products as TotalTransactions
# 
# **Hint:**
# 
# - Order Date needs to be in the select

# CELL ********************

# Challenge
df_agg = \
df.select(col("ProductKey").alias("Product"), col("SalesAmount").alias("Sales"), col("TotalProductCost"), col("Profit"), col("OrderDate"))\
.groupBy("Product")\
.agg(\
    sum("Sales").alias("Total Sales"),
    sum("TotalProductCost").alias("TotalCost"),
    sum("Profit").alias("TotalProfit"),
    max("OrderDate").alias("LastOrderDate"),
    count("Product").alias("TotalTransactions"))\
.orderBy(desc("Total Sales"))
df_agg.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Having Clause
# 
# In SQL you use the where clause to filter based on a column expression and and you use the having clause to filter by an aggregate. In PySpark, you can easily filter by an aggregation using the same **filter** function you learned earlier in the class.
# 
# **Order By**
# 
# Also, notice that we added an order by clause to order by TotalSales in descending order.
# 
# **Lab Challenge:**
# 
# - Modify the code cell below to only return rows where the Total Sales is greater than 500,000.
# 
# **Hint:**
# 
# - You can filter by the aggregated column you created "TotalSales"
# - The filter can't be at the beginning of the code because it doesn't yet recognize the new column.
# - Therefore the filter needs to be near the end, good luck!

# CELL ********************

# Challenge
df_agg = \
df.select(col("ProductKey").alias("Product"), col("SalesAmount").alias("Sales"), col("TotalProductCost"), col("Profit"), col("OrderDate"))\
.groupBy("Product")\
.agg(\
    sum("Sales").alias("TotalSales"),
    sum("TotalProductCost").alias("TotalCost"),
    sum("Profit").alias("TotalProfit"),
    max("OrderDate").alias("LastOrderDate"),
    count("Product").alias("TotalTransactions"))\
.filter(col("TotalSales") > 500000)\
.orderBy(desc("TotalSales"))

df_agg.show(n=30)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
