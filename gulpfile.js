'use strict';

const
  gulp          = require('gulp'),
  sass          = require('gulp-sass'),
  sassGlob      = require('gulp-sass-glob'),
  kit           = require('gulp-kit-2'),
  del           = require('del'),
  browserSync   = require('browser-sync').create(),
  sourcemaps    = require('gulp-sourcemaps'),
  gulpif        = require('gulp-if'),
  gcmq          = require('gulp-group-css-media-queries'),
  csso          = require('gulp-csso'),
  uglify        = require("gulp-uglify"),
  imagemin      = require("gulp-imagemin"),
  svgmin        = require("gulp-svgmin"),
  svgstore      = require("gulp-svgstore"),
  imgWebp       = require('gulp-webp'),
  newer         = require("gulp-newer"),
  rename        = require('gulp-rename'),
  postcss       = require('gulp-postcss'),
  mqpacker      = require('css-mqpacker'),
  autoprefixer  = require('autoprefixer'),
  // ghPages = require('gulp-gh-pages');
  path1         = require('path'),
  ghPages       = require('gh-pages');

const isDev     = (process.argv.indexOf('--dev') !== -1);
const isProd     = !isDev;

const path = {
  build:{
    html:      'build/',
    css:       'build/css/',
    js:        'build/js/',
    img:       'build/img/',
    fonts:     'build/fonts/'
  },
  src:{
    html:      ['src/**/*.html', '!src/**/_*.html'],
    scss:      'src/scss/style.scss',
    js:        'src/js/main.js',
    img:       ["src/img/**/*.{jpeg,jpg,png,gif,svg}", "!src/img/icons/icon-*.svg"],
    imgWebp:   'src/img/**/*.{jpeg,jpg,png}',
    spritesvg: 'src/img/icons/icon-*.svg',
    fonts:     'src/fonts/**/*.{woff,woff2}'
  },
  watch:{
    html:      ['./src/**/*.kit', './src/**/*.html'],
    scss:      'src/scss/**/*.scss',
    js:        'src/js/**/*.js',
    img:       ['!src/img/svg-sprite/*.*', 'src/img/**/*.*'],
    spritesvg: 'src/img/svg-sprite/*.svg',
    fonts:     'src/fonts/**/*.{woff,woff2}'
  },
  clean:       ['build/*'],
  deploy:      ['build/**/*.*'],
  baseDir:     ['build/']
};

function html(){
  return gulp.src(path.src.html)
      .pipe(kit())
      .pipe(gulp.dest(path.build.html))
      .pipe(browserSync.stream());
};

function style(){
  return gulp.src(path.src.scss)
      .pipe(gulpif(isDev, sourcemaps.init()))
        .pipe(sassGlob())
        .pipe(sass.sync({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(postcss([
          autoprefixer(),
          mqpacker({sort: true})
        ]))
        .pipe(gulp.dest(path.build.css))
        .pipe(csso())
        .pipe(rename({suffix: '.min'}))
      .pipe(gulpif(isDev, sourcemaps.write()))
      .pipe(gulp.dest(path.build.css))
      .pipe(browserSync.stream());
};

function js(){
  return gulp.src(path.src.js)
      // .pipe(rigger())
      .pipe(gulp.dest(path.build.js))
      .pipe(rename({ suffix: ".min" }))
      .pipe(uglify())
      .pipe(gulp.dest(path.build.js))
      .pipe(browserSync.stream());
};

function image(){
  return gulp.src(path.src.img)
        .pipe(newer(path.build.img))
      .pipe(gulpif(isProd,
        imagemin([
          imagemin.optipng({optimizationLevel: 3}),
          imagemin.mozjpeg({quality: 70, progressive: true}),
          imagemin.svgo()
        ])
      ))
      .pipe(gulp.dest(path.build.img))
      .pipe(browserSync.stream());
};

function webp(){
  return gulp.src(path.src.imgWebp)
        .pipe(newer(path.build.img))
      .pipe(imgWebp({quality: 90}))
      .pipe(gulp.dest(path.build.img))
      .pipe(browserSync.stream());
};

function spritesvg(){
  return gulp.src(path.src.spritesvg)
      .pipe(svgmin())
      .pipe(svgstore({inlineSvg: true}))
      .pipe(rename("sprite.svg"))
      .pipe(gulp.dest(path.build.img))
      .pipe(browserSync.stream());
};

function font(){
  return gulp.src(path.src.fonts)
      .pipe(newer(path.build.fonts))
      .pipe(gulp.dest(path.build.fonts))
      .pipe(browserSync.stream());
};

function clean(){
  return del(path.clean);
};

function watch (){
    browserSync.init({
        server: {
            baseDir: path.baseDir
        }
    });
  gulp.watch(path.watch.html, html);
  gulp.watch(path.watch.scss, style);
  gulp.watch(path.watch.img, image);
  gulp.watch(path.watch.js, js);
  gulp.watch(path.watch.fonts, font);
  gulp.watch(path.watch.spritesvg, spritesvg);
}

let build =  gulp.series(clean,
             gulp.parallel(
                html,
                style,
                image,
                webp,
                js,
                font,
                spritesvg
        ));

exports.build = build;
exports.watch = gulp.series(build, watch);


function deploy(cb) {
  ghPages.publish(path1.join(process.cwd(), './build'), cb);
}
exports.deploy = deploy;
