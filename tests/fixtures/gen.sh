WIDTH=150
HEIGHT=150

# # Example 1 - PNG
# terminal-life --rule b3456s3456 --reset-random --width $WIDTH --height $HEIGHT --ticks 100 --out example_1.png
# 
# # Example 2 - PNG
# terminal-life --width $WIDTH --height $HEIGHT --rule b3s23 --activation sin --theme managua --ticks 100 --phase --out example_2.png
# 
# # Example 3 
# terminal-life --width $WIDTH --height $HEIGHT --rule b3s23 --activation sin --theme managua --ticks 100 --rate 5 --phase --stream \
#   | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} -framerate 15 -i - \
#     -pix_fmt yuv420p -crf 18 -y example_3.mp4
# 
# # Example 4 - A LtL rule - no activation function
# terminal-life --reset-random --width $WIDTH --height $HEIGHT --rule r5m0s35-107b10-27m --theme viridis --ticks 100 --stream \
#   | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} -framerate 15 -i - \
#     -pix_fmt yuv420p -crf 18 -y example_4.mp4
# 
# # Example 5 - Waves initial PNG
# terminal-life --width $WIDTH --height $HEIGHT --rule b3s23 --activation sin \
#   --theme managua --alpha=-1.35 --beta 3.92 --rate 3 --ticks 150 \
#   --reset-sparse --out example_5.png
# 
# # Example 6 - Waves - Early Animation
# terminal-life --load ./example_5.png --stream --ticks 100 \
#   | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} -framerate 10 -i - \
#     -pix_fmt yuv420p -crf 18 -y example_6.mp4
# 
# # Example 7 - Waves - Ticked PNG
# terminal-life --load ./example_5.png --ticks 10 --out example_7.png
# 
# # Example 8 - Synchronized waves
 terminal-life --load ./example_7.png --stream --ticks 100 \
  | ffmpeg -f rawvideo -pixel_format rgba -video_size ${WIDTH}x${HEIGHT} -framerate 10 -i - \
    -pix_fmt yuv420p -crf 18 -y example_8.mp4

# terminal-life --width 300 --height 400 --rule b3s23 --activation gaussian --theme berlin --ticks 300 --rate 3 --phase --out example_4.png
# terminal-life --reset-random --width 300 --height 300 --rule b3s23 --activation gaussian --theme berlin --alpha 0.3 --beta 0.13 --rate 3 --ticks 400 --out example_5.png
# terminal-life --load ./example_5.png --log-json

# terminal-life --load example_5.png --stream --ticks 100 | \
# ffmpeg -f rawvideo -pixel_format rgba -video_size 300x300 -framerate 10 -i - -loop 0 example_6.webp
# terminal-life --load example_5.png  --ticks 100 --out example_7.png
# terminal-life --load example_7.png --stream --ticks 100 | \
# ffmpeg -f rawvideo -pixel_format rgba -video_size 300x300 -framerate 10 -i - -loop 0 example_8.webp
