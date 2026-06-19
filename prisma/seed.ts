import { PrismaClient, Role, ProfileMode, ModuleAudience } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear all data in correct order
  await prisma.dailyMission.deleteMany()
  await prisma.userBadge.deleteMany()
  await prisma.badge.deleteMany()
  await prisma.progress.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.module.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const studentPassword = await bcrypt.hash('aluno123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@lms.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  })

  const student = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'aluno@lms.com',
      password: studentPassword,
      role: Role.STUDENT,
      profileMode: ProfileMode.ADULT,
    },
  })

  const kidsStudent = await prisma.user.create({
    data: {
      name: 'Maria Kids',
      email: 'kids@lms.com',
      password: studentPassword,
      role: Role.STUDENT,
      profileMode: ProfileMode.KIDS,
      avatarConfig: { skin: 'peach', hair: 'brown', accessory: 'star', background: 'sky' },
    },
  })

  console.log('Users created:', admin.email, student.email, kidsStudent.email)

  await prisma.badge.createMany({
    data: [
      { slug: 'first-mission', name: 'Primeira Aventura', description: 'Complete sua primeira missão', iconEmoji: '🚀', xpReward: 25 },
      { slug: 'quiz-star', name: 'Estrela do Quiz', description: 'Acerte 5 quizzes completos', iconEmoji: '⭐', xpReward: 50 },
      { slug: 'world-complete', name: 'Conquistador', description: 'Complete um mundo inteiro', iconEmoji: '🏝️', xpReward: 100 },
      { slug: 'streak-7', name: 'Fogo de 7 Dias', description: 'Entre 7 dias seguidos', iconEmoji: '🔥', xpReward: 75 },
      { slug: 'helper', name: 'Ajudante', description: 'Complete uma lista de tarefas', iconEmoji: '🤝', xpReward: 20 },
    ],
  })

  // Create modules
  const module1 = await prisma.module.create({
    data: {
      title: 'Introdução à Informática',
      description: 'Conceitos básicos sobre computadores e tecnologia',
      order: 1,
      audience: ModuleAudience.ADULT,
    },
  })

  const module2 = await prisma.module.create({
    data: {
      title: 'Navegação na Internet',
      description: 'Como usar navegadores e acessar a internet com segurança',
      order: 2,
      audience: ModuleAudience.ADULT,
    },
  })

  const module3 = await prisma.module.create({
    data: {
      title: 'Editor de Texto',
      description: 'Aprenda a criar e editar documentos de texto',
      order: 3,
      audience: ModuleAudience.ADULT,
    },
  })

  const kidsModule1 = await prisma.module.create({
    data: {
      title: 'Mundo do Teclado',
      description: 'Descubra as teclas mágicas do computador',
      order: 1,
      audience: ModuleAudience.KIDS,
      kidsMeta: {
        worldIcon: '⌨️',
        worldColor: '#4F46E5',
        mascotIntro: 'Vamos descobrir as teclas juntos!',
      },
    },
  })

  const kidsModule2 = await prisma.module.create({
    data: {
      title: 'Mundo do Mouse',
      description: 'Aprenda a mover e clicar como um pro',
      order: 2,
      audience: ModuleAudience.KIDS,
      kidsMeta: {
        worldIcon: '🖱️',
        worldColor: '#EC4899',
        mascotIntro: 'Hora de dominar o mouse!',
      },
    },
  })

  console.log('Modules created')

  // Create lessons for module 1
  const lesson1 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'O que é um Computador?',
      order: 1,
      content: [
        {
          type: 'TEXT',
          value: 'Nesta aula vamos aprender o que é um computador e para que ele serve. Um computador é uma máquina eletrônica capaz de processar dados e realizar tarefas de forma rápida e precisa.',
        },
        {
          type: 'VIDEO',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        {
          type: 'QUIZ',
          questions: [
            {
              id: 'q1',
              question: 'O que é um computador?',
              options: [
                { id: '1', text: 'Um eletrodoméstico' },
                { id: '2', text: 'Uma máquina que processa dados' },
                { id: '3', text: 'Um tipo de telefone' },
                { id: '4', text: 'Uma calculadora grande' },
              ],
              correctOptionId: '2',
            },
          ],
        },
      ],
    },
  })

  const lesson2 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'Partes do Computador',
      order: 2,
      content: [
        {
          type: 'TEXT',
          value: 'Um computador é composto por várias partes: monitor, teclado, mouse, CPU (Unidade Central de Processamento) e outros periféricos.',
        },
        {
          type: 'ACTIVITY_CHECKLIST',
          items: [
            'Identifique o monitor do computador',
            'Localize o teclado e o mouse',
            'Encontre a CPU ou gabinete',
            'Verifique os cabos de conexão',
          ],
        },
        {
          type: 'QUIZ',
          questions: [
            {
              id: 'q1',
              question: 'Qual componente é responsável pelo processamento dos dados?',
              options: [
                { id: '1', text: 'Monitor' },
                { id: '2', text: 'Teclado' },
                { id: '3', text: 'CPU' },
                { id: '4', text: 'Mouse' },
              ],
              correctOptionId: '3',
            },
          ],
        },
      ],
    },
  })

  const lesson3 = await prisma.lesson.create({
    data: {
      moduleId: module1.id,
      title: 'Ligando e Desligando o Computador',
      order: 3,
      content: [
        {
          type: 'TEXT',
          value: 'Aprenda como ligar e desligar o computador corretamente para evitar danos ao equipamento e perda de dados.',
        },
        {
          type: 'ACTIVITY_CHECKLIST',
          items: [
            'Ligue o computador pelo botão de energia',
            'Aguarde o sistema operacional carregar completamente',
            'Para desligar, clique em Iniciar > Desligar',
            'Aguarde o computador desligar completamente antes de sair',
          ],
        },
      ],
    },
  })

  // Create lessons for module 2
  const lesson4 = await prisma.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'O que é a Internet?',
      order: 1,
      content: [
        {
          type: 'TEXT',
          value: 'A internet é uma rede mundial de computadores que permite a troca de informações entre pessoas do mundo inteiro. Por meio dela, podemos acessar sites, enviar e-mails, fazer videochamadas e muito mais.',
        },
        {
          type: 'VIDEO',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        {
          type: 'QUIZ',
          questions: [
            {
              id: 'q1',
              question: 'O que é a internet?',
              options: [
                { id: '1', text: 'Um programa de computador' },
                { id: '2', text: 'Uma rede mundial de computadores' },
                { id: '3', text: 'Um tipo de cabo elétrico' },
                { id: '4', text: 'Um sistema operacional' },
              ],
              correctOptionId: '2',
            },
          ],
        },
      ],
    },
  })

  const lesson5 = await prisma.lesson.create({
    data: {
      moduleId: module2.id,
      title: 'Usando o Navegador',
      order: 2,
      content: [
        {
          type: 'TEXT',
          value: 'O navegador (browser) é o programa que usamos para acessar sites na internet. Os mais populares são Google Chrome, Mozilla Firefox, Microsoft Edge e Safari.',
        },
        {
          type: 'ACTIVITY_CHECKLIST',
          items: [
            'Abra o navegador de sua preferência',
            'Digite um endereço na barra de endereços (ex: www.google.com)',
            'Pressione Enter para acessar o site',
            'Explore os botões de voltar e avançar',
            'Tente abrir uma nova aba',
          ],
        },
      ],
    },
  })

  // Create lessons for module 3
  const lesson6 = await prisma.lesson.create({
    data: {
      moduleId: module3.id,
      title: 'Introdução ao Word',
      order: 1,
      content: [
        {
          type: 'TEXT',
          value: 'O Microsoft Word é um editor de texto amplamente utilizado no mundo todo. Com ele, podemos criar documentos, cartas, currículos e muito mais.',
        },
        {
          type: 'VIDEO',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        {
          type: 'ACTIVITY_CHECKLIST',
          items: [
            'Abra o Microsoft Word ou LibreOffice Writer',
            'Crie um novo documento em branco',
            'Digite seu nome completo',
            'Salve o documento como "Meu primeiro documento"',
          ],
        },
      ],
    },
  })

  const lesson7 = await prisma.lesson.create({
    data: {
      moduleId: module3.id,
      title: 'Formatando Textos',
      order: 2,
      content: [
        {
          type: 'TEXT',
          value: 'Aprenda a formatar textos usando as ferramentas básicas do editor: negrito, itálico, sublinhado, tamanho e cor da fonte.',
        },
        {
          type: 'ACTIVITY_CHECKLIST',
          items: [
            'Selecione um trecho do texto',
            'Aplique negrito (Ctrl+B)',
            'Aplique itálico (Ctrl+I)',
            'Aplique sublinhado (Ctrl+U)',
            'Altere o tamanho da fonte para 16',
            'Mude a cor do texto para azul',
          ],
        },
        {
          type: 'QUIZ',
          questions: [
            {
              id: 'q1',
              question: 'Qual atalho de teclado aplica o negrito no texto?',
              options: [
                { id: '1', text: 'Ctrl+N' },
                { id: '2', text: 'Ctrl+B' },
                { id: '3', text: 'Ctrl+G' },
                { id: '4', text: 'Alt+B' },
              ],
              correctOptionId: '2',
            },
          ],
        },
      ],
    },
  })

  console.log('Lessons created')

  // Create progress records for student (first 3 lessons completed)
  await prisma.progress.createMany({
    data: [
      {
        userId: student.id,
        lessonId: lesson1.id,
        completed: true,
        completedAt: new Date(),
      },
      {
        userId: student.id,
        lessonId: lesson2.id,
        completed: true,
        completedAt: new Date(),
      },
      {
        userId: student.id,
        lessonId: lesson3.id,
        completed: true,
        completedAt: new Date(),
      },
      {
        userId: student.id,
        lessonId: lesson4.id,
        completed: false,
      },
    ],
  })

  console.log('Progress records created')

  await prisma.lesson.createMany({
    data: [
      {
        moduleId: kidsModule1.id,
        title: 'Missão 1: Conheça o Teclado',
        order: 1,
        content: [
          { type: 'TEXT', value: '<p>Olá, explorador! Hoje vamos conhecer o teclado do computador.</p><p>Ele tem muitas teclas especiais!</p>' },
          { type: 'VIDEO', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'O teclado mágico' },
          {
            type: 'QUIZ',
            questions: [
              {
                id: 'k1',
                question: 'Para que serve o teclado?',
                options: [
                  { id: '1', text: 'Digitar' },
                  { id: '2', text: 'Imprimir' },
                  { id: '3', text: 'Cozinhar' },
                ],
                correctOptionId: '1',
              },
            ],
          },
        ],
      },
      {
        moduleId: kidsModule1.id,
        title: 'Missão 2: A Tecla Enter',
        order: 2,
        content: [
          { type: 'TEXT', value: '<p>A tecla Enter confirma o que você escreveu. Procure ela no teclado!</p>' },
          {
            type: 'ACTIVITY_CHECKLIST',
            title: 'Caça ao Tesouro',
            items: ['Ache a tecla Enter', 'Pressione Enter uma vez', 'Veja o que acontece'],
          },
          {
            type: 'QUIZ',
            questions: [
              {
                id: 'k2',
                question: 'Qual tecla confirma o texto?',
                options: [
                  { id: '1', text: 'Enter' },
                  { id: '2', text: 'Esc' },
                  { id: '3', text: 'F12' },
                ],
                correctOptionId: '1',
              },
            ],
          },
        ],
      },
      {
        moduleId: kidsModule2.id,
        title: 'Missão 1: Mover o Mouse',
        order: 1,
        content: [
          { type: 'TEXT', value: '<p>O mouse ajuda você a apontar coisas na tela. Mova devagar!</p>' },
          {
            type: 'ACTIVITY_CHECKLIST',
            items: ['Mova o mouse para cima', 'Mova para baixo', 'Clique uma vez'],
          },
          {
            type: 'QUIZ',
            questions: [
              {
                id: 'k3',
                question: 'O que fazemos com o mouse?',
                options: [
                  { id: '1', text: 'Apontar e clicar' },
                  { id: '2', text: 'Digitar letras' },
                  { id: '3', text: 'Ligar o PC' },
                ],
                correctOptionId: '1',
              },
            ],
          },
        ],
      },
    ],
  })

  const allModules = [module1, module2, module3]
  const kidsModules = [kidsModule1, kidsModule2]

  await prisma.studentModuleAccess.createMany({
    data: [
      ...allModules.map((m) => ({ userId: student.id, moduleId: m.id })),
      ...kidsModules.map((m) => ({ userId: kidsStudent.id, moduleId: m.id })),
    ],
  })

  console.log('Kids lessons and module access created')
  console.log('Seeding completed!')
  console.log('\nTest credentials:')
  console.log('Admin: admin@lms.com / admin123')
  console.log('Student: aluno@lms.com / aluno123')
  console.log('Kids: kids@lms.com / aluno123')
}

main()
  .catch((e) => {
    console.error(e)
    //@ts-ignore
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
