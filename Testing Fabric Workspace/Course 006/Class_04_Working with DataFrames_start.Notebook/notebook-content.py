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

# # Working with DataFrames
# 
# Now that we have the basics of working with Spark, it's now time to put your skills to work on real data. You will undoubtedly spend the majority of your time in Spark cleaning, transforming and curating your data!
# 
# In this lab, you will learn how to import data into a dataframe and then work with that data.

# CELL ********************

#Student Lab
df = spark.read.csv("Files/movies.csv", header=True)
# df = spark.read.format("csv").option("header","true").load("Files/movies.csv")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Viewing data in the Dataframe
# 
# We know that Spark transformations are lazy, this is a great thing for performance but if we want to verify and validate our code you will need to perform an action. The data in your dataframe can be viewed in a couple of different ways. So far in this class we have used the command display in combination with limit to preview data.
# 
# The code cell below uses the Display function to **display** the data and **limit** the results to 10 rows.

# MARKDOWN ********************

# ### Display()

# CELL ********************

display(df.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Show()
# 
# Another way to quickly view data is the show command. Show also has multiple optional parameters that can be applied.
# 
# - number value  - Number of rows to return
# - truncate      - True/False
# 


# CELL ********************

df.show(10, truncate=False)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.show(10, truncate=False, vertical=True)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## View all the columns in the dataframe
# 
# You can use **.columns** to view the columns in a data frame.
# 
# You can use **.dtypes** to return the datatypes by column.


# CELL ********************

df.columns

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.dtypes

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.describe()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Type and printSchema
# 
# You will discover that there are many different object types in spark. You can use the **type()** function to return the type of a variable. You can also use **printSchema** to view the schema of a dataframe.

# CELL ********************

#df is a pyspark.sql.dataframe.DataFrame
type(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.printSchema()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### DataFrame schema
# 
# All of the columns within the DataFrame are showing a datatype of string. This is because the source was a csv file. You can add an optional parameter to spark.read.load that will infer the schema for csv files. view the code cell below.

# CELL ********************

df = spark.read.csv("Files/movies.csv", header=True, inferSchema=True)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### inferSchema
# 
# Setting the parameter **inferSchema = True** will allow Spark to look over the data and determine the datatype for each of the columns. 
# 
# Run the code cell below and compare the schema results to the previous example.

# CELL ********************

df.printSchema()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### StructType
# 
# Spark has to read all the data before it can inferSchema, this can be a performance problem and it doesn't necessarily work correctly all the time. A better option, and sometimes necessary, would be to manually define the schema and then pass that schema in as an optional parameter to the spark.read.load command.
# 
# Here is the documentation on StructField:
# 
# https://spark.apache.org/docs/latest/api/python/reference/api/pyspark.sql.types.StructField.html
# 
# Here is a list of all the different pyspark.sql.types:
# 
# https://spark.apache.org/docs/latest/sql-ref-datatypes.html
# 
# 


# CELL ********************

# Import the pyspark.sql.types library
from pyspark.sql.types import *

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# First, let's reload the DataFrame and see the verify all the columns are coming in as strings.

# CELL ********************

df = spark.read.csv("Files/Holiday.csv", header=True)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.printSchema()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Manually create the schema

# CELL ********************

holidaySchema = StructType([
  StructField('Country', StringType(), True),
  StructField('Holiday', StringType(), True),
  StructField('NormalizedHoliday', StringType(), True),
  StructField('TimeOff', BooleanType(), True),
  StructField('CountryCode', StringType(), True),
  StructField('Date', DateType(), True)
])


# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# The code cell below now leverages the **holidaySchema** create in the prior cell.

# CELL ********************

df = spark.read.csv("Files/Holiday.csv", header=True, schema=holidaySchema)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.printSchema()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
