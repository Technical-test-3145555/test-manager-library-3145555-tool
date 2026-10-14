/** Demo catalog: 40 books (8 per fixed category), 13 members. Deterministic, so the seeder can be run again. */

export const CATEGORY_IDS = {
  Novela: '11111111-1111-4111-8111-111111111111',
  Ciencia: '22222222-2222-4222-8222-222222222222',
  Tecnología: '33333333-3333-4333-8333-333333333333',
  Historia: '44444444-4444-4444-8444-444444444444',
  Infantil: '55555555-5555-4555-8555-555555555555',
};

const TITLES = {
  Novela: [
    ['Cien años de soledad', 'Gabriel García Márquez'],
    ['El amor en los tiempos del cólera', 'Gabriel García Márquez'],
    ['Pedro Páramo', 'Juan Rulfo'],
    ['La ciudad y los perros', 'Mario Vargas Llosa'],
    ['Rayuela', 'Julio Cortázar'],
    ['Ficciones', 'Jorge Luis Borges'],
    ['La casa de los espíritus', 'Isabel Allende'],
    ['Crónica de una muerte anunciada', 'Gabriel García Márquez'],
  ],
  Ciencia: [
    ['Breve historia del tiempo', 'Stephen Hawking'],
    ['El gen egoísta', 'Richard Dawkins'],
    ['Cosmos', 'Carl Sagan'],
    ['El origen de las especies', 'Charles Darwin'],
    ['La estructura de las revoluciones científicas', 'Thomas Kuhn'],
    ['Silent Spring', 'Rachel Carson'],
    ['El hombre anumérico', 'John Allen Paulos'],
    ['Los dragones del Edén', 'Carl Sagan'],
  ],
  Tecnología: [
    ['Código limpio', 'Robert C. Martin'],
    ['Arquitectura limpia', 'Robert C. Martin'],
    ['Refactorización', 'Martin Fowler'],
    ['El programador pragmático', 'Andrew Hunt'],
    ['Patrones de diseño', 'Erich Gamma'],
    ['Diseño de aplicaciones intensivas en datos', 'Martin Kleppmann'],
    ['Domain-Driven Design', 'Eric Evans'],
    ['El mes-hombre mítico', 'Frederick Brooks'],
  ],
  Historia: [
    ['Sapiens', 'Yuval Noah Harari'],
    ['Armas, gérmenes y acero', 'Jared Diamond'],
    ['Las venas abiertas de América Latina', 'Eduardo Galeano'],
    ['La historia me absolverá', 'Fidel Castro'],
    ['Historia de la guerra del Peloponeso', 'Tucídides'],
    ['El Mediterráneo', 'Fernand Braudel'],
    ['Los orígenes del totalitarismo', 'Hannah Arendt'],
    ['Breve historia de Colombia', 'Jorge Orlando Melo'],
  ],
  Infantil: [
    ['El principito', 'Antoine de Saint-Exupéry'],
    ['Alicia en el país de las maravillas', 'Lewis Carroll'],
    ['Pinocho', 'Carlo Collodi'],
    ['Matilda', 'Roald Dahl'],
    ['Charlie y la fábrica de chocolate', 'Roald Dahl'],
    ['La historia interminable', 'Michael Ende'],
    ['Momo', 'Michael Ende'],
    ['Las aventuras de Tom Sawyer', 'Mark Twain'],
  ],
};

export const BOOKS = Object.entries(TITLES).flatMap(([category, list], c) =>
  list.map(([title, author], i) => ({
    title,
    author,
    // 13 digits, deterministic and unique: 978 followed by ten consecutive digits.
    isbn: `978${1000000000 + c * 10 + i}`,
    category_id: CATEGORY_IDS[category],
    total_copies: 3 + ((c + i) % 3),
  })),
);

/** Members with a loan that will be overdue (created with the clock shifted, DT-21). */
export const OVERDUE_MEMBERS = [1, 2, 3].map((n) => ({ full_name: `Socio Moroso ${n}`, document_number: `SEED-OD-${n}` }));

/** Members with ordinary loans. */
export const REGULAR_MEMBERS = Array.from({ length: 10 }, (_, i) => ({
  full_name: `Socio Demostración ${String(i + 1).padStart(2, '0')}`,
  document_number: `SEED-${String(i + 1).padStart(2, '0')}`,
}));
