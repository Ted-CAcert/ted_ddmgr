# Overview

ted_ddmgr is my pathetic attempt to create a replacement for the incredible D&D Tools by (probably) Andy Adamczak.

Design goal is a server hosted tool working for all browsers that allows Dungeon Masters and Mistresses to manage their monsters, NPCs, encounters, 
campaigns, time passing and the status of their PCs, especially experience.

Due to personal requirements it should be centered on D&D 3.5e rules, but the goal is to keep it extensible for other (roughly similar) rulesets.

I'm using this project mainly to learn and collect experience with coding in node, my hope of getting something usable is quite low. 
Everything I do can surely be done in different ways, and probably in better ones. 

# Requirements
- Node in a sensible version. Testing and development is done on v20, but earlier versions may also work.
- MariaDB or MySQL, development is done on MariaDB version 10.6.18, but dependency on the SQL database is weak. Might run on other [DBMS](https://en.wikipedia.org/wiki/Database) with some adjustments.

# Installation

- Clone the repository into a local directory.
- Copy config.template.js to config.js and adjust it to your environment. **I urgently recomment to change the password!**
- Use create_db.sql to create your empty database
- Create one (or more) initial web users in the database using the following two statements[^1]. You probably want to change all occurences of ***YOUR WEB-USERNAME*** and ***A SECRET PASSWORD*** to something more sensible.
  - INSERT INTO Person(PersonLogin, PasswordHash) SELECT '***YOUR WEB-USERNAME***', LEFT(UUID(), 8);
  - UPDATE Person SET PasswordHash=(SELECT CONCAT('sha256:', PasswordHash, ':', TO_BASE64(SHA2(CONCAT(PasswordHash, '***A SECRET PASSWORD***'), 256))) FROM Person WHERE PersonLogin='***YOUR WEB-USERNAME***') WHERE PersonLogin='***YOUR WEB-USERNAME***';
- Open a shell and change to the cloned repository
- Run **npm install** to install all dependencies
- Run **npm start** to start the service

Now you should be able to access the service as http://localhost:3000 in a browser for development purposes.

## ToDo

In a productive environment one would probably use nginx as a forward proxy, so nginx handles SSL connections. Also the node service should be installed as a system service.

[^1]: The first one inserts the record and a random salt, the second one updates the salt into the "real" password. 