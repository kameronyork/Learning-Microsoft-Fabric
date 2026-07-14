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

# # Writing Data
# 
# So far in this course you have learned how to read data and then transform and manipulate that data. Now it's time to look at how to various methods for writing data.
# 
# First, we will explore writing data to your Lakehouse files. Just like the spark.read command you learned earlier in the class, there is also **spark.write**.
# 
# - spark.write.load
# - spark.write.csv
# - spark.write.parquet
# 
# ## spark.write.load
# 
# When using spark.write.load, you specify the file type as a separate parameter. The shortened versions of spark.write.load for a csv file would be spark.write.csv.

# MARKDOWN ********************

# ## Read data into the notebook

# CELL ********************

df = spark.read.csv("Files/Holiday.csv", header=True, inferSchema=True)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Lab Challenge:
# 
# Modify the code cell below to return different names for each of the columns being returned.
# 
# - countryOrRegion       - Rename to "Country"
# - holidayName           - Rename to "Holiday"

# CELL ********************

#Student Lab
# df_CountryHoliday = df.select(df.countryOrRegion, df.holidayName).withColumnsRenamed({'countryOrRegion': 'Country', 'holidayName': 'Holiday'})
df_CountryHoliday = df.select(df.countryOrRegion.alias('Country'), df.holidayName.alias('Holiday'))
df_CountryHoliday.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Challenge:
# 
# Alias the columns again, but this time try using the col function.
# 
# - countryOrRegion       - Rename to "Country"
# - holidayName           - Rename to "Holiday"

# CELL ********************

from pyspark.sql.functions import col

df_CountryHoliday = df.select(col("countryOrRegion").alias('Country'), col("holidayName").alias('Holiday'))
df_CountryHoliday.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Write Data to your Lakehouse files:
# 
# **Challenge:**
# 
# - Write the data that you have modifed in this notebook to your Lakehouse files.
# - Complete the code cell below and then run the cell
# 


# CELL ********************

# Challenge
df.write.parquet("Files/Holiday2.csv", "overwrite")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# Count the rows - This should return 275 rows
df.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Write Modes
# 
# ### Four write modes exist:
# 
# - append
# - overwrite
# - error or errorifexists
# - ignore
# 
# ### Challenge
# 
# - Modify the code cell below so that the data you load will be appended to the existing data.

# CELL ********************

#Challenge
df.write.mode("append").format("parquet").save("Files/Holiday2.csv")
# df.write.parquet("Files/Holiday2.csv", "append")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# Read the data that was just loaded back into a new DataFrame
df_parquet = spark.read.parquet("Files/Holiday2.csv")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# Count the rows - The data should be duplicated returning 550 rows.
df_parquet.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# Remove duplicates from the DataFrame
dfNoDuplicates = df_parquet.dropDuplicates()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# Count the number of rows that are now in the DataFrame, it should be back to 275 rows.
dfNoDuplicates.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Write Modes
# 
# ### Four write modes exist:
# 
# - append
# - overwrite
# - error or errorifexists
# - ignore
# 
# ### Challenge
# 
# - Modify the code cell below so that you replace the data in the current directory

# CELL ********************

# Challenge - replace the data in the directory
dfNoDuplicates.write.parquet("Files/Holiday2.csv", "overwrite")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# Reload the DataFrame
df_parquet = spark.read.parquet("Files/Holiday2.csv")
display(df_parquet.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# Validate the results
df_parquet.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Write data to a table
# 
# While working with Notebooks in Fabric it is common to create tables using data you are manipulating in your notebook. Lets see how this can be done.

# CELL ********************

df.write.mode("overwrite").format("delta").saveAsTable("Holiday_Table")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df_HolidayTable = spark.sql("SELECT * FROM lh_pySparkODL.dbo.holiday_table LIMIT 1000")
display(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************


# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
