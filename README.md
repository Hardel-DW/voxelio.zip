# What is `client-zip` / `@voxelio/zip` ?

Ce projet est un fork de [client-zip](https://github.com/Touffy/client-zip) mais
avec de nombreuse modifications, j'avais besoin d'une nouvelle fonction qui
n'existait pas dans le projet original. Et je ne veux pas empiéter sur le projet
original. Ces pour cela que je l'ai forké.

J'ai concrétement ajouté une fonction qui permet d'obtenir les fichiers d'un zip
existant, zip qui est obtenable de n'importe quelle maniére dans mon cas je
souhaités l'obtenir depuis un input file par un site frontend. J'en ai profité
pour nettoyer le code et le rendre plus propre avec Biome/Deno.

## Installation

```sh
pnpm i @voxelio/zip
```

## Je vous invite a lire les différents markdown du projets initial pour avoir plus d'informations sur le projet.

Ma fonctionnalités étant ultra spécifique et je pense qu'il n'est pas pertinent
de PR vers le repository officiel, sauf si l'auteur le souhaite, ou une forte
demande de la part du community.

Ce repository passes les tests unitaires du projet initial, ainsi que les
miennes, j'ai souhaités respectés les régles de style du projet initial.

- Pas de dépendances (VRAIMENT MERCI David Junger)
- Un projet avec la taille la plus basse possible sans réellement chercher
  l'optimisation à fond.
- Un projet qui ne respecte par forcémement les vieux navigateurs (IE11) etc...
- Un projet TS qui utilise les imports modernes. Et non require.
- Un projet rapide dans l'exécution.

A savoir que ce fork n'a pas encore était tester sur tout les navigateurs !!!!!

### TODO

Faut que je pense a enlever mon mock qui est issus d'un autre projet, pour
quelque chose de plus propre.
