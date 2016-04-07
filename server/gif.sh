palette="pal.png"
#palette=netscape.gif
#palette=colormap_332.png
filters="fps=9,scale=300:-1:flags=lanczos:sws_dither=6"

ffmpeg -v warning -i $1 -vf "$filters,palettegen" -y $palette
ffmpeg -v warning -i $1 -i $palette -lavfi "$filters [x]; [x][1:v] paletteuse" -y $2
#rm $1.png

convert -delay 1 -loop 0 -layers optimize -colors 64 -fuzz 10% -ordered-dither o8x8,256 $2 $2
gifsicle -O2 $2 > $2
#convert -delay 1 $1  -layers OptimizeTransparency -map netscape.gif $2
