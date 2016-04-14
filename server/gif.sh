palette="$1.png"
#palette=netscape.gif
#palette=colormap_332.png
filters="fps=9,scale=300:-1:flags=lanczos:sws_dither=6"
ffmpeg -v warning -i $1 -vf "$filters,palettegen" -y $palette
ffmpeg -v warning -i $1 -i $palette -lavfi "$filters [x]; [x][1:v] paletteuse" -y $2


convert -delay 10 -loop 0 -layers Optimize -colors 32 -fuzz 20% -ordered-dither o8x8,4,4,4 $2 $2
gifsicle -O3 -o $2 $2 &
rm $1.png &
rm $1 &
#convert -delay 1 $1  -layers OptimizeTransparency -map netscape.gif $2
