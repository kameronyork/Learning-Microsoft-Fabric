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

# # Working with NULL values
# 
# ### In this section you will learn:
# - How to filter out nulls
# - How to replace nulls

# CELL ********************

df = spark.read.load("Files/InternetSales.snappy.parquet", header=True, inferSchema=True, format='parquet')
display(df.limit(10))

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

type(df)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Removing rows that have Null Values.
# 
# In PySpark you can use **na.drop()** to drop rows that have null values in your dataframe.
# 
# In this section we are going to explore the default behavior of na.drop() as well as the optional parameters:
# 
# - how
# - thresh
# - subset

# MARKDOWN ********************

# ### na.drop()
# 
# First let's take a look at the command na.drop(). This function will drop any rows that have a null anywhere in that row.

# CELL ********************

df_new = df.na.drop()
df_new.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### How
# 
# As mentioned before, their are multiple optional parameters. 
# 
# **Options: **
# 
# - Any - Drop the row if any columns have a null _(this is the default)_
# - All - Drop the row if all columns have nulls

# CELL ********************

# First, let's update the CustomerPONumber column to not always be null.
# If the SalesAmount is > 500, we will replace CustomerPONumber with the CustomerKey

from pyspark.sql.functions import when

df = df.withColumn("CustomerPONumber", 
        when(
                df.SalesAmount > 500, 
                df.CustomerKey
        )
        .otherwise(
                df.CustomerPONumber
        )
)
display(df.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df_new = df.na.drop(how="all")
df_new.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df_new = df.na.drop(how="any")
df_new.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Thresh
# 
# The thresh property allows you to set the specific count of non-null columns. This property will override the how property.
# 
# When using the thresh property you will drop rows that have less than the number(threshold) you specify of non null columns. It's a little confusing so let's look at an example.

# CELL ********************

# Count the number of columns present in the dataframe. We know two columns have Null values
print(len(df.columns))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df_new = df.na.drop(thresh=26)
df_new.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# #### Explanation
# 
# The code cell above returned the same number of rows as previously. This is because no rows met the criteria specified to be dropped.
# 
# **Lab Exercise:**
# 
# Run the code cell below but pass in the value of 25 and value of 24 to see the difference.
# 
# - How many rows of data were returned when you set thresh to 25?
# - How many rows of data were returned when you set thresh to 24?

# CELL ********************

df_new = df.na.drop(thresh=25)
df_new.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df.filter(df.SalesAmount > 500).count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Subset
# 
# If you're like me, you're probably thinking how can I specify NULL values in particular columns. You can specify a column or list of columns with the parameter Subset.
# 
# You can specify a string or list. Notice below we are specifying a list which includes Title and MiddleName but you can obviously adjust accordingly.

# CELL ********************

df_new = df.na.drop(subset=['CarrierTrackingNumber', 'CustomerPONumber'])
df_new.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df_new = df.na.drop(subset=['ProductKey', 'SalesAmount'])
df_new.count()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Fill
# 
# What if you could fill in the nulls instead of getting rid of them? Well you can! The fill function will allow you to provide an optional value for a column you specify.
# 
# **Lab Example:**
# 
# In the code cell below, we replace NULL values in the Title and Middlename column with the value "Unknown'

# CELL ********************

df_new = df.na.fill("Unknown")
display(df_new.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df_new = df.na.fill("Unknown", ['CustomerPONumber', 'CarrierTrackingNumber'])
display(df_new.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

df_new = df.na.fill({'CarrierTrackingNumber': "Unknown", 'CustomerPONumber': 50})
display(df_new.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
