CREATE TABLE [dbo].[UniqueConstraintTable] (

	[c1] int NOT NULL, 
	[c2] int NULL
);


GO
ALTER TABLE [dbo].[UniqueConstraintTable] ADD CONSTRAINT UK_UniqueConstraintTablec1 unique NONCLUSTERED ([c1]);