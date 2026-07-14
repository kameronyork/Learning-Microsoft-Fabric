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

# # Filtering Data in PySpark
# 
# In this lab, you are going to learn how to filter data using PySPark.
# 
# - Basic Filtering with (=, !=)
# - StartsWith / EndsWith
# - Contains
# - Using Lists
# - LIKE
# - Multiple Conditions

# MARKDOWN ********************

# ## Movies Data
# 
# First, import data from the Movies.csv file.


# CELL ********************

df = spark.read.csv("Files/movies.csv", header=True, inferSchema=True)
display(df.limit(10))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Filter the records returned.
# 
# - Only return a specific record using **==**

# CELL ********************

df.filter(df.title == "Toy Story (1995)").show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Return all records except a specific record
# 
# - Using **!=**

# CELL ********************

df.filter(df.movieId != 4).show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Startswith and Endswith
# 
# - Return all records that start with "Toy"

# CELL ********************

# Return all rows that Start with "TOY"
df.filter(df.title.startswith("Toy")).show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Does not Startwith
# 
# - Use **~** at the beginning to specify **not**

# CELL ********************

# Return all rows that do NOT start with "TOY"
df.filter(~df.title.startswith("Toy")).show(n=10, truncate=False)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

# Return all rows where the Genre ends with fantasy
df.filter(df.genres.endswith("Fantasy")).show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### OR Condition
# 
# - Use the **|** delimeter to specify an or condition

# CELL ********************

# Return all the rows where the genres ends with or starts with Fantasy
df.filter(df.genres.endswith("Fantasy") | df.genres.startswith("Fantasy")).show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Contains
# 
# - Use the contains function to return rows that match a specific string.

# CELL ********************

# What if Fantasy is somewhere in the middle?
# Return all the rows where Fantasy exist in the genres column
df.filter(df.genres.contains("Fantasy")).show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### AND Condition
# 
# - Use the **&** to specify an **and** condition

# CELL ********************

# Return all the rows where Genres column contains Adventure and Fantasy
# Return all the rows where the genres ends with or starts with Fantasy
df.filter(df.genres.contains("Fantasy") & df.genres.contains("Adventure")).show(n=20, truncate=False)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Case Sensitivity

# CELL ********************

# Does case sensitivity matter? Try the code again but with a lowercase F
df.filter(df.genres.contains("fantasy")).show()

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Lower Function
# 
# - Use the lower function to work around case sensitivity

# CELL ********************

# Fix the case sensitivity by first making all the characters lowercase in the genres column
from pyspark.sql.functions import lower
df.filter(lower(df.genres).contains("fantasy")).show(truncate=False)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Using a list to filter
# 
# - **isin** can be used similar to the SQL in function

# CELL ********************

MovieIds = [1,3,4,7,9]
df.filter(df.movieId.isin(MovieIds)).show(n=10, truncate=False)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### LIKE function in PySpark
# 
# - Use the **like** function to return rows that match a string.
# - This is very similar to the contains function, but with more flexibility

# CELL ********************

# How to use LIKE filtering, similar to SQL
df.filter(df.title.like("%World%")).show(n=10, truncate=False)

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
