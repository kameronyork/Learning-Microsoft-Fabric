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

# # Variables
# 
# Variables are very common in any programming or expression language. Variables are used to make your code more readable and reusable.
# 
# In this lab you will create some basic variables and then combine those variables together to create an output.
# 
# **Exercise:**
# 
# In the code cell below, create three variables:
# 
# - FirstName
# - Hobby
# - Age

# CELL ********************

# Create the variables specified above and provide them with values:

FirstName = 'Zane'
Hobby = 'Longboarding'
Age = 24

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# # Data Types
# 
# Variables can be of various data types and data structures. The variables FirstName and Hobby are naturally going to be string data types. The Age variable could be a string or an integer, depending on your input value.
# 
# For example:
# 
# - The value of **35** without any quotes would be an integer.
# - The value of **'35'** with quotes would be a string.
# 
# How did you specify your age value? If you specified it as a string then the code below will run without any problems! However, if you pass in an integer value to the below code it will fail.

# CELL ********************

type(Age)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

print("My name is " + FirstName + ", My favorite hobby is " + Hobby + ". " + FirstName + " is " + Age + " years old.")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Changing data types 1
# 
# Many times you won't be able to control what values or data types are being passed into your code. Therefore, you may need to convert data types to make the code work as expected. As you will learn there are actually quite a few different ways to change the data type in PySpark, in this example we are going to use the function **str()**.

# CELL ********************

#Demo
print("My name is " + FirstName + ", My favorite hobby is " + Hobby + ". " + FirstName + " is " + str(Age) + " years old.")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Changing data types 2
# 
# Let's take a look at a couple of simpler examples.

# CELL ********************

var1 = "a"
var2 = 2

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Print out the combined value of var1 + var2
# 
# **Challenge:**
# 
# - Convert var2 to string and complete the code cell below

# CELL ********************

#Challenge
print(var1 + str(var2))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### str() and int()
# 
# You have now seen a couple of examples of how to convert a value to a string. In this next example, you will learn how to convert a value to an integer.


# CELL ********************

var1 = '1'
var2 = 2

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Print out the combined value of var1 + var2. _The printed value should be 3._
# 
# **Challenge:**
# 
# - **PRINT** out the combined value of the two variables returning an integer.
# - The combined values of the variables should return 3.

# CELL ********************

#Challenge
print(int(var1) + var2)

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
