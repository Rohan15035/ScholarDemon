const bcrypt = require("bcryptjs");
const { pool } = require("./config");

async function seed() {
  const client = await pool.connect();

  try {
    console.log("Starting database seeding...");

    await client.query("BEGIN");

    // Seed Users
    console.log("Seeding users...");
    const passwordHash = await bcrypt.hash("password123", 10);

    const userResult = await client.query(
      `
      INSERT INTO users (name, email, password_hash, role, is_verified)
      VALUES 
        ('John Doe', 'john@example.com', $1, 'admin', true),
        ('Jane Smith', 'jane@example.com', $1, 'user', true),
        ('Alice Johnson', 'alice@example.com', $1, 'user', true),
        ('Bob Wilson', 'bob@example.com', $1, 'author', true),
        ('Carol Brown', 'carol@example.com', $1, 'user', false)
      RETURNING user_id
    `,
      [passwordHash]
    );

    // Seed Institutions
    console.log("Seeding institutions...");
    const instResult = await client.query(`
      INSERT INTO institutions (name, country, website, type)
      VALUES 
        ('Massachusetts Institute of Technology', 'USA', 'https://mit.edu', 'university'),
        ('Stanford University', 'USA', 'https://stanford.edu', 'university'),
        ('University of Cambridge', 'UK', 'https://cam.ac.uk', 'university'),
        ('Max Planck Institute', 'Germany', 'https://mpi.de', 'research_lab'),
        ('Google AI Research', 'USA', 'https://ai.google', 'company'),
        ('ETH Zurich', 'Switzerland', 'https://ethz.ch', 'university'),
        ('University of Tokyo', 'Japan', 'https://u-tokyo.ac.jp', 'university')
      RETURNING institution_id
    `);

    // Seed Research Areas
    console.log("Seeding research areas...");
    const areaResult = await client.query(`
      INSERT INTO research_areas (area_name, description)
      VALUES 
        ('Machine Learning', 'Algorithms and statistical models for computer learning'),
        ('Natural Language Processing', 'Computational processing of human language'),
        ('Computer Vision', 'Automatic extraction and analysis of visual information'),
        ('Database Systems', 'Storage, retrieval, and management of data'),
        ('Distributed Systems', 'Systems with components located on networked computers'),
        ('Artificial Intelligence', 'Simulation of human intelligence processes'),
        ('Software Engineering', 'Systematic approach to software development'),
        ('Cybersecurity', 'Protection of computer systems and networks'),
        ('Quantum Computing', 'Computing using quantum-mechanical phenomena'),
        ('Bioinformatics', 'Application of computational techniques to biological data')
      RETURNING area_id
    `);

    // Seed Authors
    console.log("Seeding authors...");
    const authorResult = await client.query(`
      INSERT INTO authors (name, affiliation, email, orcid_id, research_interests, institution_id)
      VALUES 
        ('Dr. Emily Chen', 'Computer Science Dept', 'emily.chen@mit.edu', '0000-0001-2345-6789', 'Machine Learning, Deep Learning', 1),
        ('Prof. Michael Zhang', 'AI Lab', 'mzhang@stanford.edu', '0000-0002-3456-7890', 'Natural Language Processing, AI Ethics', 2),
        ('Dr. Sarah Williams', 'Dept of Engineering', 's.williams@cam.ac.uk', '0000-0003-4567-8901', 'Computer Vision, Robotics', 3),
        ('Dr. Robert Schmidt', 'Algorithms Group', 'r.schmidt@mpi.de', '0000-0004-5678-9012', 'Distributed Systems, Algorithms', 4),
        ('Dr. Lisa Anderson', 'Google Brain', 'landerson@google.com', '0000-0005-6789-0123', 'Deep Learning, Reinforcement Learning', 5),
        ('Prof. David Kim', 'Computer Science', 'dkim@ethz.ch', '0000-0006-7890-1234', 'Database Systems, Big Data', 6),
        ('Dr. Maria Garcia', 'Information Systems', 'm.garcia@u-tokyo.ac.jp', '0000-0007-8901-2345', 'Data Mining, ML Applications', 7),
        ('Dr. James Thompson', 'CS Department', 'jthompson@mit.edu', '0000-0008-9012-3456', 'Software Engineering, DevOps', 1),
        ('Dr. Anna Lee', 'Security Lab', 'alee@stanford.edu', '0000-0009-0123-4567', 'Cybersecurity, Cryptography', 2),
        ('Prof. Thomas Brown', 'Quantum Lab', 't.brown@cam.ac.uk', '0000-0010-1234-5678', 'Quantum Computing, Quantum Algorithms', 3)
      RETURNING author_id
    `);

    // Link authors to research areas
    console.log("Linking authors to research areas...");
    await client.query(`
      INSERT INTO author_research_areas (author_id, area_id)
      VALUES 
        (1, 1), (1, 6),
        (2, 2), (2, 6),
        (3, 3), (3, 6),
        (4, 5), (4, 1),
        (5, 1), (5, 6),
        (6, 4), (6, 5),
        (7, 1), (7, 4),
        (8, 7), (8, 5),
        (9, 8), (9, 1),
        (10, 9), (10, 1)
    `);

    // Seed Venues
    console.log("Seeding venues...");
    const venueResult = await client.query(`
      INSERT INTO venues (name, short_name, type, publisher, impact_factor, issn_or_isbn)
      VALUES 
        ('Neural Information Processing Systems', 'NeurIPS', 'conference', 'NeurIPS Foundation', 8.523, NULL),
        ('International Conference on Machine Learning', 'ICML', 'conference', 'PMLR', 7.891, NULL),
        ('Computer Vision and Pattern Recognition', 'CVPR', 'conference', 'IEEE', 9.156, NULL),
        ('Journal of Machine Learning Research', 'JMLR', 'journal', 'MIT Press', 4.256, '1532-4435'),
        ('ACM Transactions on Database Systems', 'TODS', 'journal', 'ACM', 2.573, '0362-5915'),
        ('Nature Machine Intelligence', 'Nat Mach Intell', 'journal', 'Nature Publishing', 15.508, '2522-5839'),
        ('IEEE Transactions on Pattern Analysis', 'TPAMI', 'journal', 'IEEE', 17.861, '0162-8828'),
        ('Association for Computational Linguistics', 'ACL', 'conference', 'ACL', 6.234, NULL)
      RETURNING venue_id
    `);

    // Seed Keywords
    console.log("Seeding keywords...");
    const keywordResult = await client.query(`
      INSERT INTO keywords (keyword)
      VALUES 
        ('deep learning'), ('neural networks'), ('computer vision'), 
        ('natural language processing'), ('machine learning'), ('artificial intelligence'),
        ('transformers'), ('convolutional networks'), ('recurrent networks'),
        ('reinforcement learning'), ('supervised learning'), ('unsupervised learning'),
        ('transfer learning'), ('attention mechanism'), ('generative models'),
        ('image classification'), ('object detection'), ('sentiment analysis'),
        ('language models'), ('recommendation systems')
      RETURNING keyword_id
    `);

    // Seed Papers
    console.log("Seeding papers...");
    const paperResult = await client.query(`
      INSERT INTO papers (title, abstract, year, doi, pdf_url, venue_id, pages, citation_count)
      VALUES 
        (
          'Attention Is All You Need',
          'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
          2017,
          '10.5555/3295222.3295349',
          'https://arxiv.org/pdf/1706.03762.pdf',
          1,
          '5998-6008',
          50000
        ),
        (
          'Deep Residual Learning for Image Recognition',
          'We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
          2016,
          '10.1109/CVPR.2016.90',
          'https://arxiv.org/pdf/1512.03385.pdf',
          3,
          '770-778',
          75000
        ),
        (
          'BERT: Pre-training of Deep Bidirectional Transformers',
          'We introduce BERT, designed to pre-train deep bidirectional representations by jointly conditioning on both left and right context.',
          2019,
          '10.18653/v1/N19-1423',
          'https://arxiv.org/pdf/1810.04805.pdf',
          8,
          '4171-4186',
          35000
        ),
        (
          'Generative Adversarial Networks',
          'We propose a new framework for estimating generative models via an adversarial process.',
          2014,
          '10.5555/2969033.2969125',
          'https://arxiv.org/pdf/1406.2661.pdf',
          1,
          '2672-2680',
          40000
        ),
        (
          'ImageNet Classification with Deep CNNs',
          'We trained a large, deep convolutional neural network to classify ImageNet images into 1000 different classes.',
          2012,
          '10.1145/3065386',
          'https://papers.nips.cc/paper/4824-imagenet-classification.pdf',
          1,
          '1097-1105',
          85000
        ),
        (
          'Adam: A Method for Stochastic Optimization',
          'We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions.',
          2015,
          '10.48550/arXiv.1412.6980',
          'https://arxiv.org/pdf/1412.6980.pdf',
          2,
          NULL,
          65000
        ),
        (
          'Dropout: A Simple Way to Prevent Neural Networks from Overfitting',
          'We show that dropout improves the performance of neural networks on supervised learning tasks.',
          2014,
          '10.5555/2627435.2670313',
          'http://jmlr.org/papers/v15/srivastava14a.html',
          4,
          '1929-1958',
          28000
        ),
        (
          'Batch Normalization: Accelerating Deep Network Training',
          'We propose Batch Normalization, a method that makes normalization a part of the model architecture.',
          2015,
          '10.5555/3045118.3045167',
          'https://arxiv.org/pdf/1502.03167.pdf',
          2,
          '448-456',
          32000
        ),
        (
          'You Only Look Once: Unified Real-Time Object Detection',
          'We present YOLO, a new approach to object detection that frames detection as a regression problem.',
          2016,
          '10.1109/CVPR.2016.91',
          'https://arxiv.org/pdf/1506.02640.pdf',
          3,
          '779-788',
          22000
        ),
        (
          'EfficientNet: Rethinking Model Scaling for CNNs',
          'We systematically study model scaling and identify that carefully balancing network depth, width, and resolution is critical.',
          2019,
          '10.5555/3524938.3525050',
          'https://arxiv.org/pdf/1905.11946.pdf',
          2,
          '6105-6114',
          12000
        ),
        (
          'GPT-3: Language Models are Few-Shot Learners',
          'We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance.',
          2020,
          '10.5555/3495724.3495883',
          'https://arxiv.org/pdf/2005.14165.pdf',
          1,
          '1877-1901',
          15000
        ),
        (
          'ResNet Variants for Image Classification',
          'We explore various modifications to the residual network architecture for improved performance.',
          2021,
          '10.1109/CVPR46437.2021.00123',
          'https://arxiv.org/pdf/2104.00298.pdf',
          3,
          '1234-1242',
          450
        ),
        (
          'Vision Transformers for Dense Prediction',
          'We adapt the Vision Transformer architecture for dense prediction tasks.',
          2021,
          '10.1109/ICCV48922.2021.01227',
          'https://arxiv.org/pdf/2103.13413.pdf',
          3,
          '12179-12188',
          890
        ),
        (
          'Self-Supervised Learning: A Survey',
          'We provide a comprehensive survey of self-supervised learning methods in computer vision.',
          2020,
          '10.1109/TPAMI.2020.3007032',
          'https://arxiv.org/pdf/1902.06162.pdf',
          7,
          '1-18',
          3200
        ),
        (
          'Federated Learning: Challenges and Opportunities',
          'We discuss the challenges in federated learning and propose directions for future research.',
          2021,
          '10.1109/MIS.2021.3057946',
          'https://arxiv.org/pdf/1912.04977.pdf',
          5,
          '127-135',
          1800
        ),
        (
          'Explainable AI: A Review of Methods',
          'We review recent methods for making AI systems more interpretable and explainable.',
          2020,
          '10.1016/j.inffus.2019.12.012',
          'https://arxiv.org/pdf/1910.10045.pdf',
          6,
          '82-115',
          2500
        ),
        (
          'Graph Neural Networks: A Review',
          'We provide a comprehensive review of graph neural network architectures and applications.',
          2020,
          '10.1109/TNNLS.2020.2978386',
          'https://arxiv.org/pdf/1812.08434.pdf',
          7,
          '4627-4642',
          5600
        ),
        (
          'Contrastive Learning for Visual Representations',
          'We present a framework for learning visual representations by contrasting positive pairs against negative samples.',
          2020,
          '10.5555/3524938.3525087',
          'https://arxiv.org/pdf/2002.05709.pdf',
          2,
          '1597-1607',
          8900
        ),
        (
          'Zero-Shot Learning: A Comprehensive Evaluation',
          'We evaluate various zero-shot learning approaches across multiple benchmarks.',
          2019,
          '10.1109/TPAMI.2018.2857768',
          'https://arxiv.org/pdf/1707.00600.pdf',
          7,
          '2761-2779',
          1400
        ),
        (
          'Neural Architecture Search: A Survey',
          'We survey the landscape of neural architecture search methods and their applications.',
          2019,
          '10.5555/3455716.3455813',
          'https://arxiv.org/pdf/1808.05377.pdf',
          4,
          '1997-2017',
          3100
        )
      RETURNING paper_id
    `);

    // Link papers to authors
    console.log("Linking papers to authors...");
    await client.query(`
      INSERT INTO paper_authors (paper_id, author_id, author_order)
      VALUES 
        (1, 2, 1), (1, 5, 2),
        (2, 3, 1), (2, 1, 2),
        (3, 2, 1), (3, 5, 2),
        (4, 5, 1), (4, 1, 2),
        (5, 1, 1), (5, 3, 2),
        (6, 5, 1),
        (7, 1, 1), (7, 2, 2),
        (8, 1, 1), (8, 3, 2),
        (9, 3, 1),
        (10, 1, 1), (10, 3, 2),
        (11, 2, 1), (11, 5, 2),
        (12, 3, 1), (12, 1, 2),
        (13, 3, 1), (13, 1, 2),
        (14, 1, 1), (14, 7, 2),
        (15, 4, 1), (15, 6, 2),
        (16, 5, 1), (16, 2, 2),
        (17, 1, 1), (17, 6, 2),
        (18, 1, 1), (18, 3, 2),
        (19, 7, 1), (19, 1, 2),
        (20, 1, 1), (20, 8, 2)
    `);

    // Link papers to keywords
    console.log("Linking papers to keywords...");
    await client.query(`
      INSERT INTO paper_keywords (paper_id, keyword_id)
      VALUES 
        (1, 7), (1, 14), (1, 4),
        (2, 1), (2, 8), (2, 16),
        (3, 4), (3, 7), (3, 19),
        (4, 15), (4, 1), (4, 6),
        (5, 3), (5, 8), (5, 16),
        (6, 5), (6, 11),
        (7, 2), (7, 5),
        (8, 1), (8, 2),
        (9, 3), (9, 17),
        (10, 3), (10, 8), (10, 16),
        (11, 4), (11, 19),
        (12, 3), (12, 1),
        (13, 3), (13, 7),
        (14, 5), (14, 12),
        (15, 5), (15, 4),
        (16, 6), (16, 5),
        (17, 5), (17, 2),
        (18, 3), (18, 12),
        (19, 3), (19, 5),
        (20, 2), (20, 5)
    `);

    // Link papers to research areas
    console.log("Linking papers to research areas...");
    await client.query(`
      INSERT INTO paper_research_areas (paper_id, area_id)
      VALUES 
        (1, 1), (1, 2),
        (2, 1), (2, 3),
        (3, 2), (3, 1),
        (4, 1), (4, 3),
        (5, 3), (5, 1),
        (6, 1),
        (7, 1),
        (8, 1),
        (9, 3), (9, 1),
        (10, 3), (10, 1),
        (11, 2), (11, 1),
        (12, 3), (12, 1),
        (13, 3), (13, 1),
        (14, 1),
        (15, 1), (15, 5),
        (16, 6), (16, 1),
        (17, 1),
        (18, 3), (18, 1),
        (19, 1), (19, 3),
        (20, 1), (20, 7)
    `);

    // Seed Citations
    console.log("Seeding citations...");
    await client.query(`
      INSERT INTO citations (citing_paper_id, cited_paper_id, citation_context)
      VALUES 
        (3, 1, 'Building upon the transformer architecture...'),
        (11, 1, 'Following the attention mechanism introduced in...'),
        (12, 2, 'Inspired by residual connections...'),
        (13, 2, 'Using ResNet as the backbone...'),
        (10, 2, 'Leveraging residual learning...'),
        (13, 1, 'Incorporating transformer blocks...'),
        (11, 3, 'Similar to BERT pretraining...'),
        (18, 4, 'Utilizing adversarial training...'),
        (12, 5, 'Starting from ImageNet pretrained models...'),
        (10, 5, 'Based on convolutional features...'),
        (13, 5, 'Using ImageNet initialization...'),
        (2, 5, 'Previous work on CNNs...'),
        (8, 7, 'Dropout regularization...'),
        (10, 8, 'Batch normalization layers...'),
        (12, 8, 'Including batch norm...'),
        (13, 9, 'Object detection methods like YOLO...'),
        (11, 6, 'Optimized using Adam...'),
        (14, 1, 'Self-attention mechanisms...'),
        (14, 7, 'Regularization techniques...'),
        (15, 1, 'Distributed training of transformers...'),
        (16, 3, 'Model interpretability in BERT...'),
        (17, 1, 'Graph attention networks...'),
        (18, 7, 'Contrastive learning with dropout...'),
        (19, 14, 'Zero-shot via self-supervised learning...'),
        (20, 1, 'NAS for transformer architectures...')
    `);

    // Seed User Library
    console.log("Seeding user libraries...");
    await client.query(`
      INSERT INTO user_library (user_id, paper_id, user_notes, rating)
      VALUES 
        (1, 1, 'Groundbreaking work on attention', 5),
        (1, 2, 'Essential reading for CNNs', 5),
        (1, 5, 'Classic paper', 5),
        (2, 1, 'Very influential', 4),
        (2, 3, 'Useful for NLP projects', 5),
        (2, 11, 'Recent work to explore', 4),
        (3, 4, 'Interesting GAN approach', 4),
        (3, 9, 'Good object detection method', 4),
        (3, 14, 'Comprehensive survey', 5),
        (4, 1, 'Must read', 5),
        (4, 6, 'Best optimizer so far', 5)
    `);

    // Seed User Follows Authors
    console.log("Seeding user follows authors...");
    await client.query(`
      INSERT INTO user_follows_authors (user_id, author_id)
      VALUES 
        (1, 1), (1, 2), (1, 5),
        (2, 1), (2, 3),
        (3, 3), (3, 5),
        (4, 1), (4, 2), (4, 4)
    `);

    // Seed User Follows Venues
    console.log("Seeding user follows venues...");
    await client.query(`
      INSERT INTO user_follows_venues (user_id, venue_id)
      VALUES 
        (1, 1), (1, 2), (1, 3),
        (2, 1), (2, 8),
        (3, 3), (3, 7),
        (4, 1), (4, 4)
    `);

    // Seed Comments
    console.log("Seeding comments...");
    await client.query(`
      INSERT INTO comments (user_id, paper_id, comment_text, parent_comment_id)
      VALUES 
        (1, 1, 'This paper revolutionized NLP!', NULL),
        (2, 1, 'Agreed! The attention mechanism is brilliant.', 1),
        (3, 1, 'Has anyone implemented this from scratch?', 1),
        (1, 2, 'ResNets are still widely used today.', NULL),
        (2, 3, 'BERT changed everything for transfer learning.', NULL),
        (4, 3, 'The bidirectional aspect is key.', 5),
        (1, 5, 'AlexNet started the deep learning revolution.', NULL),
        (2, 11, 'Excited to see GPT-3 applications!', NULL),
        (3, 14, 'Great survey paper for beginners.', NULL),
        (4, 9, 'YOLO is incredibly fast for real-time detection.', NULL)
    `);

    // Seed Search History
    console.log("Seeding search history...");
    await client.query(`
      INSERT INTO search_history (user_id, search_query)
      VALUES 
        (1, 'attention mechanism'),
        (1, 'transformer architecture'),
        (1, 'computer vision'),
        (2, 'BERT natural language processing'),
        (2, 'object detection'),
        (3, 'generative adversarial networks'),
        (3, 'self-supervised learning'),
        (4, 'neural architecture search')
    `);

    await client.query("COMMIT");
    console.log("Database seeding completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = seed;
