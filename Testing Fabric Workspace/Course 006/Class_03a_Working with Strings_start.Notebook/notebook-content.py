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

# # Working with Strings
# 
# One of the most common things you will do in Spark, if not the most common thing, is work with strings. In this lab, you will learn the basics of working with string values.
# 
# **Example**:
# 
# For simplicity, you have a variable called var1 that stores a value, the value is pragmatic-Works. In this lab, you will perform various string manipulations to that variable and print the results.

# CELL ********************

var1 = 'pragmatic-Works'

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Lower and Upper functions 1
# 
# Strings values can easily be converted to upper and lower text characters by using the functions: lower and upper.
# 
# **Challenge:**
# 
# - Take the variable called var1 and PRINT the results of that variable as all **lower** characters:
# 


# CELL ********************

#Challenge
print(var1.lower())

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Lower and Upper functions 2
# 
# Strings values can easily be converted to upper and lower text characters by using the functions: lower and upper.
# 
# **Challenge:**
# 
# - Take the variable called var1 and PRINT the results of that variable as all **upper** characters:

# CELL ********************

#Challenge
print(var1.upper())

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Length Function (len)
# 
# Manipulation of strings can very quickly become a complex challenge with various different functions working together. In this example, let's take a look at the Length function: **len**
# 
# **Challenge:**
# 
# - Take the variable called var1 and PRINT the **length** of the variable.
# 


# CELL ********************

#Challenge
print(var1)
print("Length: " + str(len(var1)))

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# # Return specific index
# 
# You can return a specific character or item from a string, list, or array by just specifying the index position. 
# 
# For example: If you want to return the first character from PragmaticWorks, you can use the following command: 
# 
# Var1[0]

# CELL ********************

print(var1[0])

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Return a range of indexes 1
# 
# You can also specify a range that you would like to return. For example, we saw previously that our variable has 15 characters. The following expression would return characters 2-15, omitting the first character:
# 
# **var1[1:15]**

# CELL ********************

print(var1[1:15])

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Return a range of indexes 2
# 
# Sometimes you may not know exactly how long the string is, therefore you may not be able to hardcode the last index position. A creative solution might be to use the expression **len(var1)** to return the number of characters in the string and use that value as the ending index position.
# 
# However, if you want to provide a starting position and grab all index positions after that, you can leave the ending index blank. Keep in mind, this logic also applies for the starting index.
# 
# Therefore, the expression **var1[1:]** will return the same result as var[1:15] in the previous code example. Of course, var1[1:] is more dynamic and would be preferred here.

# CELL ********************

print(var1[1:len(var1)])

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# CELL ********************

print(var1[1:])

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ## Find
# 
# The find function will allow you to search a string for a specific value and then return the ordinal position of your search criteria. Be careful, the find function will return -1 if no matching result is found!
# 
# **Lab Challenge:**
# 
# - Return the index position of the hyphen character in var1.
# 
# Hint:
# 
# - Use **find("string)**
# - The result should be **9**

# CELL ********************

#Student Lab
find_character = "-"
print(f"Determining the position of the '{find_character}' character...")

found_position = var1.find(find_character)

if found_position < 0:
    print(f"The '{find_character}' character does not exist in the sample string")
else:   
    print(f"The '{find_character}' character has been found in position {found_position}")

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# # Lab Exercise 1 (Hard)
# This lab exercise is meant to be a little bit more challenging. Instructor will review after lab time has expired. Make sure to go back through previous lab challenges as necessary.
# 
# So far you have learned a few different techniques for working with string values. This lab challenge will require that you pull together multiple concepts.
# 
# **Lab challenge:**
# 
# - Return the string "Works" from var1. 
# 
# Hint: 
# - Use find to determine the starting position.
# - Return the range of indexes from that starting position.
# - There are a couple of ways to get the same result. 

# CELL ********************

#Challenge
print(var1[var1.find("W"):])

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }

# MARKDOWN ********************

# ##  Replace Function
# 
# Another very common operation is to replace characters in a string with another string value. This can be achieved in PySpark using the replace function:
# 
# **Challenge:**
# 
# - Replace the hyphen (-) in var1 with a space using the replace function.
# 
# **Hint:**
# 
# The replace function will take two string parameters. The basic syntax is **.replace("String to Search", "Replacement")**
# 
# - Parameter 1 - The text to search for
# - Parameter 2 - The text to replace the text with

# CELL ********************

#Challenge
print(var1.replace("-", " ").title())

# METADATA ********************

# META {
# META   "language": "python",
# META   "language_group": "synapse_pyspark"
# META }
