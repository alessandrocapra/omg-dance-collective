palette="pal.png"
#palette=netscape.gif
#palette=colormap_332.png

ffmpeg -v warning -i $1 -vf "$filters,palettegen" -y $palette
ffmpeg -v warning -i $1 -i $palette -lavfi "$filters [x]; [x][1:v] paletteuse" -y $2
#rm $1.png

convert -delay 2 -loop 0 -layers Optimize -colors 32 -fuzz 30% -ordered-dither o8x8,4,4,4 $2 $2
gifsicle -O3 -o $2 $2
#convert -delay 1 $1  -layers OptimizeTransparency -map netscape.gif $2
