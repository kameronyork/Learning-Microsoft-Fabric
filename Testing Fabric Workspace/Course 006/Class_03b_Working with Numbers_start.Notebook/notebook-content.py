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

# # Working with Numbers
# 
# Working with numbers is also very common in Spark. In this lab, you will learn some basics of working with numbers.
# 
# **Example**:
# 
# For simplicity, we have created a few variables that will be used throughout the lab. 

# CELL ********************

firstName           = 'Zane'        #Replace with your name
startingSavings     = 1000
monthlySavings      = 100
yearsTilRetirement  = 10

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Data Types
# 
# As you learned previously, when combining different datatypes you will need to explicitly convert them to prevent errors.
# 
# **Challenge:**
# 
# - Modify the code cell below so that it runs successfully.
# - Change the data types on variables **monthlySavings** and **yearsTilRetirement**.
# 
# **Hint:**
# 
# Use the str() function.

# CELL ********************

#Student Lab
print(f"{firstName} saves ${monthlySavings} per month and has {yearsTilRetirement} years until retirement")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Basic Math operations
# 
# Performing addition, subtraction, division and multiplication is as simple as just providing the operator.
# 
# In the code cell below. You can determine Zane's savings amount after 1 year. (startingSavings + (monthlySavings * 12))

# CELL ********************

savingsAfter1Year = startingSavings + (monthlySavings * 12)
print(f"{firstName}\'s savings after 1 year will be: ${str(savingsAfter1Year)}")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Min  / Max / Round
# 
# Min, max, and round are very common mathematical functions. In this section you will see some simple examples showing their use.

# CELL ********************

# Create a list of numbers
numbers = [43, 485, 150, 1623, 2345, 1048]

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Min function
# 
# The code below returns the minimum value from a list of numbers.

# CELL ********************

print(min(numbers))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Max function
# 
# **Challenge:**
# - Print the maximum number from the list.
# - Complete the code cell below using the **max** function

# CELL ********************

#Challenge
print(max(numbers))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Round function 1
# 
# Another common function is round. The code cell below returns the rounded value.
# 
# **Challenge:**
# 
# - Complete the following code cell to make the results without an error.

# CELL ********************

#Student Lab
print(f"The value of 1.2 is naturally rounded down to the value of: {round(1.2)}")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Round Function 2
# 
# The following code cell has been completed for you. Notice how the value is rounded up.

# CELL ********************

print(f"The value of 2.75 is naturally rounded up to the value of: {round(2.75)}")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Floor / Ceiling / Square Root
# 
# Some other common math functions would be floor, ceiling and square root. 
# 
# Often times in Spark you will need to import libraries and functions into your notebook in order for them to be available. The code below will **FAIL** because the **function floor is not defined**.

# CELL ********************

# This code cell will fail with an error, move on to the next cell
print(floor(1.9))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ### Import Math functions
# 
# As you saw in the previous code cell. Sometimes it's necessary to import functions. Run the code cell below.

# CELL ********************

from math import floor, ceil, sqrt

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

print(floor(1.9))
print(ceil(1.9))
print(sqrt(16))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
