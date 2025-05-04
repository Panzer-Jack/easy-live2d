import { defineConfig } from 'vitepress'
import * as pkg from '../../package.json'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: '/easy-live2d/',
    title: "EasyLive2d",
    description: "基于 Pixi.js 封装的 轻量级 Live2D Web SDK",

    // 忽略死链接检查
    ignoreDeadLinks: true,

    head: [
        ['meta', { name: 'author', content: pkg.author.name }],
        [
            'meta',
            {
                name: 'keywords',
                content: 'EasyLive2D, Live2D, Pixi.js, Web SDK, JavaScript, TypeScript',
            },
        ],
        ['link', { rel: 'icon', href: '/favicon.ico' }],
    ],

    // 国际化配置
    locales: {
        root: {
            label: '简体中文',
            lang: 'zh-CN',
            link: '/',
            themeConfig: {
                nav: [
                    { text: '指南', link: '/guide/' },
                    { text: 'API', link: '/api/' },
                    { text: '示例', link: '/examples/basic' },
                ],
                sidebar: {
                    '/guide/': [
                        {
                            text: '介绍',
                            items: [
                                { text: '什么是 EasyLive2D', link: '/guide/' },
                                { text: '安装配置', link: '/guide/installation' },
                                { text: '快速开始', link: '/guide/getting-started' },
                                { text: '基本用法', link: '/guide/basic-usage' },
                            ]
                        }
                    ],
                    '/api/': [
                        {
                            text: 'API 参考',
                            items: [
                                { text: '概览', link: '/api/' },
                            ]
                        }
                    ],
                    '/examples/': [
                        {
                            text: '示例',
                            items: [
                                { text: '基础示例', link: '/examples/basic' },
                            ]
                        }
                    ]
                }
            }
        },
        en: {
            label: 'English',
            lang: 'en-US',
            link: '/en/',
            themeConfig: {
                nav: [
                    { text: 'Guide', link: '/en/guide/' },
                    { text: 'API', link: '/en/api/' },
                    { text: 'Examples', link: '/en/examples/basic' },
                ],
                sidebar: {
                    '/en/guide/': [
                        {
                            text: 'Introduction',
                            items: [
                                { text: 'What is EasyLive2D', link: '/en/guide/' },
                                { text: 'Installation', link: '/en/guide/installation' },
                                { text: 'Getting Started', link: '/en/guide/getting-started' },
                                { text: 'Basic Usage', link: '/en/guide/basic-usage' },
                            ]
                        }
                    ],
                    '/en/api/': [
                        {
                            text: 'API Reference',
                            items: [
                                { text: 'Overview', link: '/en/api/' },
                            ]
                        }
                    ],
                    '/en/examples/': [
                        {
                            text: 'Examples',
                            items: [
                                { text: 'Basic Examples', link: '/en/examples/basic' },
                            ]
                        }
                    ]
                }
            }
        }
    },

    lastUpdated: true,

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        logo: '/EasyLive2D.png',

        socialLinks: [
            { icon: 'github', link: 'https://github.com/Panzer-Jack/easy-live2d' }
        ],

        footer: {
            message: '基于 MIT 许可发布',
            copyright: `Copyright © ${new Date().getFullYear()} Panzer_Jack`
        },

        search: {
            provider: 'local'
        }
    }
})