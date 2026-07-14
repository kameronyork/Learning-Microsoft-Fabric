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

# # Querying Data
# 
# Now that you understand more about DataFrames and their structures, you can finally start doing some cool stuff. In this lab you will learn how to return specific data.

# MARKDOWN ********************

# ## Running Select Statements
# 
# In this section you will learn a couple of new commands that you can use when working with data frames.
# 
# - select
# - alias
# - withColumn
# - distinct
# - removeDuplicates
# - drop
# - dropDuplicates

# CELL ********************

df = spark.read.csv("Files/Holiday.csv", header=True, inferSchema=True)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

display(df.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df_Country = df.select(df.countryOrRegion)
df_Country.show(5)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### DataFrame notation
# 
# In the previous code cell we used the dataframe notation to reference the column name. You can also use the string value of the column without referencing the dataframe.
# 
# - DataFrame notation      : df.ColumnName
# - StringValue             : 'ColumnName'
# 
# Understanding the difference here will be important later because there are times when one option might be required vs. the other!

# MARKDOWN ********************

# ### Select

# CELL ********************

df_CountryHoliday = df.select("countryOrRegion", "holidayName")
df_CountryHoliday.show(5)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Alias
# 
# You can also use **alias()** to return a different name for the column.
# 
# In the code cell below, we use **alias("Holiday")** to return the column name Holiday instead of holidayName

# CELL ********************

df_CountryHoliday = df.select(df.countryOrRegion, df.holidayName.alias("Holiday"))
df_CountryHoliday.show(5)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### withColumnRenamed
# 
# Another method for renaming columns is withColumnRenamed.

# CELL ********************

df = df\
.withColumnRenamed('holidayName', 'Holiday')\
.withColumnRenamed('countryOrRegion', 'Country')
df.show(5)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Distinct
# 
# Like SQL, distinct will look at all the columns of the rows and only return the unique rows.

# CELL ********************

dfDistinct = df.distinct()
dfDistinct.show(5)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Distinct 2
# 
# Just to see this a little bit clearer. In the example below, we are going to create a sample table on the fly. 
# 
# Once the new dataFrame is created and loaded, we now want to return only distinct rows from the dataFrame.

# CELL ********************

list = \
    [("Mark Cuban", "CEO", 9000), 
    ("Mark Cuban", "CEO", 9000), 
    ("Elon Musk", "CIO", 15000), 
    ("Elon Musk", "CIO", 15000), 
    ("Zane Goodman", "Janitor", 19000)
]
columns= ["Employee", "Department", "Salary"]
data = spark.createDataFrame(data = list, schema = columns)
data.printSchema()
data.show(truncate=False)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

distinctData = data.dropDuplicates()
distinctData.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

distinctData = data.distinct()
distinctData.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

list = \
    [("Mark Cuban", "CEO", 11000), \
    ("Mark Cuban", "CEO", 9000), \
    ("Elon Musk", "CIO", 15000), \
    ("Elon Musk", "CIO", 15000),
    ("Zane Goodman", "Janitor", 19000)
]
columns= ["Employee", "Department", "Salary"]
data = spark.createDataFrame(data = list, schema = columns)
data.printSchema()
data.show(truncate=False)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

distinctData = data.dropDuplicates()
distinctData.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

distinctData = data.dropDuplicates(["Employee"])
display(distinctData)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Specify column or columns to define uniqueness
# 
# You can use **dropDuplicates** to add specificity when removing duplicates from a data frame. 
# 
# **Challenge**
# 
# - Modify the PySpark code cell below to only return 1 employee.


# CELL ********************

# Challenge
distinctData = data.dropDuplicates()
display(distinctData)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### With Column
# 
# You can use **withColumn** to add additional columns to an existing dataFrame. 
# You can also use **withColumnRenamed** to rename an existing column.

# CELL ********************

data.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# #### col function 
# 
# #### Create column from existing using column
# 
# Here we use the col function to reference an existing column and then multiple that column by 2.
# 
# Before you use the col function you want to make sure to import the function from pyspark.sql.functions.

# CELL ********************

from pyspark.sql.functions import col

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

data = data.withColumn("SalaryIncrease", col("Salary") * 2)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

data.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# #### lit function
# 
# The **lit** function is used to add a constant value to a data frame column. In this example, we add the value "USA" for country.
# 
# Before you use the lit function you want to make sure to import the function from pyspark.sql.functions.


# CELL ********************

from pyspark.sql.functions import lit

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

data = data.withColumn("Country", lit("USA"))
data.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# #### SELECT
# 
# Alternatively, you can add new columns when using SELECT. withColumn adds a new column to the entirety of the dataframe. SELECT allows you to select specific columns and then add a new column to only that subset of columns. 

# CELL ********************

dataShort = data.select(col("Employee"), lit("Pragmatic Works").alias("Company"))
dataShort.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Drop Columns
# 
# You may wish to drop columns from your DataFrame, especially once you no longer need a column.
# 
# For example, earlier in this lab we created a new salary column from the original. Well, we no longer need that original salary column.

# CELL ********************

data = data.drop("Salary")
data.show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
