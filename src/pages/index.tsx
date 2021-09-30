import { GetStaticProps } from 'next';
import Head from "next/head";
import Link from "next/Link";
import Prismic from '@prismicio/client';

import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR';

import { FiUser, FiCalendar } from 'react-icons/fi';
import Header from "../components/Header";

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const { next_page, results } = postsPagination;

  const formattedPost = results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date), 
        "dd MMM yyyy", 
        { locale: ptBR }
      )
    }
  })
  
  const [ posts, setPosts ] = useState(formattedPost);
  const [ nextPage, setNextPage ] = useState(next_page);
  const [ currentPage, setCurrentPage ] = useState(1);

  async function handleNextPage() {
    if ( currentPage !== 1 && nextPage === null ) {
      return;
    }

    const postsResults = await fetch(`${ nextPage }`)
      .then( response => response.json() )
      .catch( err => {
        return;
      })

    setNextPage( postsResults.next_page );
    setCurrentPage( postsResults.page );

    const newPosts = postsResults.results.map( post => {
      return {  
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date), 
          "dd MMM yyyy", 
          { locale: ptBR }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }
    })

    setPosts([ ...posts, ...newPosts ])
  }
  
  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>                    
      
      <main className={ commonStyles.commonContainer }>
        <Header />

        <div className={ styles.posts }>
          { posts.map( post => (
            <Link key={ post.uid } href={`/post/${post.uid}`}>
              <a className={ styles.postExcerpt }>
                <h1>{ post.data.title }</h1>
                
                <p>{ post.data.subtitle }</p>
                
                <span>
                  <FiCalendar />

                  <time>{ post.first_publication_date }</time>

                  <FiUser />

                  { post.data.author }
                </span>
              </a>
            </Link>
           ) ) }
          
          { nextPage && (
            <button onClick={ handleNextPage } type="button">Carregar mais posts</button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ], {
    pageSize: 1
  });

  const posts = postsResponse.results.map( post => {
    return {  
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts
  }

  return {
    props: {
      postsPagination,
    }
  }
};
