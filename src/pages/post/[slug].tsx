import { GetStaticPaths, GetStaticProps } from 'next';

import Head from "next/head";
import { FiCalendar, FiClock, FiUser } from "react-icons/fi";
import Header from "../../components/Header";

import { getPrismicClient } from '../../services/prismic';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { ptBR } from 'date-fns/locale';
import format from 'date-fns/format';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;
    const body = contentItem.body.map((bodyItem) => bodyItem.text.split(' ').length);
    body.map((bodyItem) => {total += bodyItem})

    return total;
  }, 0);

  const totalMinutesReading = Math.ceil( totalWords / 200 );

  const router = useRouter();

  const formattedDate = format(
    new Date(post.first_publication_date), 
    "dd MMM yyyy", 
    { locale: ptBR }
  )

  return router.isFallback 
    ? ( <h1>Carregando...</h1> )
    : (
      <>
        <Head>
          <title>{`${ post.data.title } | spacetraveling`}</title>
        </Head>

        <Header />

        <img src={ post.data.banner.url } alt="banner" className={styles.banner} />

        <main className={commonStyles.commonContainer}>
          <article className={styles.postContainer}>
            <div className={styles.postHead}>
              <h1>{ post.data.title }</h1>

              <div>
                <FiCalendar />

                <time>{ formattedDate }</time>

                <FiUser />

                <span>{ post.data.author }</span>

                <FiClock />

                <span>{`${ totalMinutesReading } min`}</span>
              </div>
            </div>

            {
              post.data.content.map(content => (
                <div key={ content.heading }>
                  <h2>{content.heading}</h2>
                  <div 
                    className={ styles.postBody }
                    dangerouslySetInnerHTML={{ __html: RichText.asHtml( content.body ) }}
                  />
                </div>
              ))
            } 
          </article>
        </main>
      </>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at( 'document.type', 'post' )
  );

  const paths = posts.results.map( (post) => {
    return {
      params: {
        slug: post.uid,
      }
    }
  })

  return {
    paths,
    fallback: true,
  }  
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url
      },
      content: response.data.content.map(contet => {
        return { 
          heading: contet.heading, 
          body: [...contet.body] 
        }
      })
    }
  }

  return {
    props: {
      post
    }
  };
};
