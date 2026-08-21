CREATE TABLE salas (

    id SERIAL PRIMARY KEY,

    nome VARCHAR(100),

    tipo VARCHAR(50),

    andar INTEGER,

    x DOUBLE PRECISION,

    y DOUBLE PRECISION,

    z DOUBLE PRECISION

);


CREATE TABLE conexoes (

    id SERIAL PRIMARY KEY,

    origem_id INTEGER,

    destino_id INTEGER,

    distancia DOUBLE PRECISION

);


CREATE TABLE beacons (

    id SERIAL PRIMARY KEY,

    uuid VARCHAR(100),

    nome VARCHAR(100),

    sala_id INTEGER

);